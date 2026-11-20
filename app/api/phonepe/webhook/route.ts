import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidPhonePeWebhook } from '@/lib/phonepe';
import { confirmPaidOrder } from '@/lib/merchOrders';

// Backup path: PhonePe calls this when a payment finishes, so an order is still confirmed
// if the customer closes the tab before the browser reaches /verify.
// Set up in PhonePe Business dashboard -> Developer settings -> Webhooks:
//   URL https://taranaband.in/api/phonepe/webhook, events checkout.order.completed and checkout.order.failed,
//   and the same username/password as PHONEPE_WEBHOOK_USERNAME / PHONEPE_WEBHOOK_PASSWORD.
export async function POST(request: NextRequest) {
  if (!isValidPhonePeWebhook(request.headers.get('authorization') || '')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const event = await request.json();
    // Failed payments need no action: the order simply stays unpaid
    if (event?.event !== 'checkout.order.completed') {
      return NextResponse.json({ received: true });
    }

    const merchantOrderId = String(event?.payload?.merchantOrderId || '');
    if (!merchantOrderId) {
      return NextResponse.json({ received: true });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: order } = await supabase
      .from('merch_orders')
      .select('*')
      .eq('id', merchantOrderId)
      .maybeSingle();

    if (!order) {
      // Not a merch order from this site; nothing to do
      return NextResponse.json({ received: true });
    }

    // confirmPaidOrder re-checks the payment with PhonePe, so the webhook body is never trusted on its own
    const result = await confirmPaidOrder(supabase, order);
    if (!result.ok) {
      console.error('Webhook could not confirm order', order.id, result.error);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes PhonePe retry the webhook later
    console.error('PhonePe webhook error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
