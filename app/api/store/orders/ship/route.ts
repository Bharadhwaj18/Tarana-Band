import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRiglyRequest } from '@/lib/rigly';
import { shipOrder } from '@/lib/merchFulfilment';

const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rigly's "Mark shipped" button: same as shipping from this site's admin (email to the customer, Rigly updated).
export async function POST(request: NextRequest) {
  if (!isRiglyRequest(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || '');
  const tracking = typeof body?.tracking === 'string' ? body.tracking.trim().slice(0, 200) : '';
  if (!ORDER_ID.test(orderId)) return NextResponse.json({ error: 'Unknown order.' }, { status: 400 });
  if (!tracking) return NextResponse.json({ error: 'Add the tracking number.' }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'The website database is not configured.' }, { status: 500 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const result = await shipOrder(supabase, orderId, { trackingNumber: tracking, carrier: 'India Post' });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  if (!result.riglySynced) {
    return NextResponse.json({ error: 'Shipped on the website and the customer was emailed, but Rigly could not be updated. Refresh in a minute.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, emailSent: result.emailSent, rigly: result.rigly });
}
