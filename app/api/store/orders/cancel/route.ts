import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRiglyRequest } from '@/lib/rigly';
import { cancelOrder } from '@/lib/merchFulfilment';

const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rigly's "Cancel order" button: same as cancelling from this site's admin, without a refund screenshot
// (the customer's email says the refund is on its way). Rigly gets the stock back.
export async function POST(request: NextRequest) {
  if (!isRiglyRequest(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || '');
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (!ORDER_ID.test(orderId)) return NextResponse.json({ error: 'Unknown order.' }, { status: 400 });
  if (!reason) return NextResponse.json({ error: 'Say why it’s being cancelled.' }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'The website database is not configured.' }, { status: 500 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const result = await cancelOrder(supabase, orderId, { reason });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  if (!result.riglySynced) {
    return NextResponse.json({ error: 'Cancelled on the website and the customer was emailed, but Rigly could not be updated. Refresh in a minute.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, emailSent: result.emailSent, rigly: result.rigly });
}
