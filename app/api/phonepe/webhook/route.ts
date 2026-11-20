import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidPhonePeWebhook } from '@/lib/phonepe';
import { reconcileOrderById } from '@/lib/merchOrders';

const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Backup path: PhonePe calls this when a payment finishes, so an order is still confirmed
// if the customer closes the tab before the browser sees the result.
// Set up in PhonePe Business dashboard -> Developer settings -> Webhooks:
//   URL https://taranaband.in/api/phonepe/webhook, events checkout.order.completed and checkout.order.failed,
//   and the same username/password as PHONEPE_WEBHOOK_USERNAME / PHONEPE_WEBHOOK_PASSWORD.
// The webhook body is never trusted for the payment result: every order is re-checked with PhonePe directly.
export async function POST(request: NextRequest) {
  const authorized = isValidPhonePeWebhook(request.headers.get('authorization') || '');
  const event = await request.json().catch(() => null);
  const merchantOrderId = String(event?.payload?.merchantOrderId || '');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!authorized) {
    // PhonePe's rule for a webhook that fails the check: discard it, and check the order's status instead
    if (ORDER_ID.test(merchantOrderId)) {
      await reconcileOrderById(supabase, merchantOrderId).catch((error) =>
        console.error('Status check after bad webhook failed:', error)
      );
    }
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    // Use the event name (the old "type" field is deprecated). A failed payment needs no action here:
    // the order stays unpaid and is settled later.
    if (event?.event !== 'checkout.order.completed' || !ORDER_ID.test(merchantOrderId)) {
      return NextResponse.json({ received: true });
    }

    const result = await reconcileOrderById(supabase, merchantOrderId);
    if (result && !result.ok) {
      console.error('Webhook could not confirm order', merchantOrderId, result.error);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes PhonePe retry the webhook later
    console.error('PhonePe webhook error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
