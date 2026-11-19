import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidWebhookSignature } from '@/lib/razorpay';
import { confirmPaidOrder } from '@/lib/merchOrders';

// Backup path: Razorpay calls this when a payment is captured, so an order is still
// confirmed if the customer closes the tab before the browser reaches /verify.
// Set up in Razorpay Dashboard -> Webhooks with the events payment.captured and order.paid,
// and the same secret as RAZORPAY_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
      return NextResponse.json({ received: true });
    }

    const payment = event.payload?.payment?.entity;
    if (!payment?.id || !payment?.order_id) {
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
      .eq('razorpay_order_id', payment.order_id)
      .maybeSingle();

    if (!order) {
      // Not a merch order from this site; nothing to do
      return NextResponse.json({ received: true });
    }

    const result = await confirmPaidOrder(supabase, order, payment.id);
    if (!result.ok) {
      console.error('Webhook could not confirm order', order.id, result.error);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes Razorpay retry the webhook later
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
