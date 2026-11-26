import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidRazorpayWebhook } from '@/lib/razorpay';
import { reconcileOrderByGatewayId } from '@/lib/merchOrders';

// Backup path: Razorpay calls this when a payment is captured, so an order is still confirmed
// if the customer closes the tab before the browser sees the result.
// Set up in Razorpay dashboard -> Account & Settings -> Webhooks:
//   URL https://taranaband.in/api/razorpay/webhook, events payment.captured and order.paid,
//   and the secret you type there is RAZORPAY_WEBHOOK_SECRET.
// The webhook body is never trusted for the payment result: every order is re-checked with Razorpay directly.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidRazorpayWebhook(rawBody, request.headers.get('x-razorpay-signature') || '')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event?.event !== 'payment.captured' && event?.event !== 'order.paid') {
      return NextResponse.json({ received: true });
    }

    const razorpayOrderId = String(
      event?.payload?.payment?.entity?.order_id || event?.payload?.order?.entity?.id || ''
    );
    if (!razorpayOrderId) return NextResponse.json({ received: true });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const result = await reconcileOrderByGatewayId(supabase, razorpayOrderId);
    if (result && !result.ok) {
      console.error('Webhook could not confirm Razorpay order', razorpayOrderId, result.error);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes Razorpay retry the webhook later
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
