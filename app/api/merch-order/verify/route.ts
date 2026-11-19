import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidPaymentSignature } from '@/lib/razorpay';
import { confirmPaidOrder } from '@/lib/merchOrders';

// Called by the browser right after Razorpay checkout reports a successful payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || '');
    const razorpayOrderId = String(body?.razorpay_order_id || '');
    const razorpayPaymentId = String(body?.razorpay_payment_id || '');
    const signature = String(body?.razorpay_signature || '');

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !signature) {
      return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    if (!isValidPaymentSignature(razorpayOrderId, razorpayPaymentId, signature)) {
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: order, error: fetchError } = await supabase
      .from('merch_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order || order.razorpay_order_id !== razorpayOrderId) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const result = await confirmPaidOrder(supabase, order, razorpayPaymentId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, emailSent: result.emailSent });
  } catch (error) {
    console.error('Verify merch payment error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
