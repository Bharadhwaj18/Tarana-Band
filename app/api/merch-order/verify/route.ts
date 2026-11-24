import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmPaidOrder } from '@/lib/merchOrders';

// Called by the browser when the PhonePe pay page closes, or when PhonePe sends the customer
// back to /merch?order=<id>. The server checks with PhonePe directly; the browser only says which order.
// Responds with the order summary so the receipt can be shown even after a full page redirect.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || '');

    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      return NextResponse.json({ error: 'Missing order.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
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

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ state: 'FAILED', error: 'This order was cancelled.' }, { status: 400 });
    }

    let result;
    try {
      result = await confirmPaidOrder(supabase, order);
    } catch (error) {
      // PhonePe couldn't be reached just now. Report it as still pending so the browser keeps checking on its
      // schedule instead of telling a customer who may have paid that something broke.
      console.error('Verify merch payment: PhonePe check failed, will retry:', error);
      return NextResponse.json({ state: 'PENDING', error: 'Still checking your payment with PhonePe.' }, { status: 202 });
    }
    if (!result.ok) {
      const status = result.state === 'PENDING' ? 202 : 400;
      return NextResponse.json({ state: result.state, error: result.error }, { status });
    }

    return NextResponse.json({
      state: 'COMPLETED',
      emailSent: result.emailSent,
      orderId: order.id,
      items: order.items,
      total: Number(order.total_amount),
      email: order.email,
    });
  } catch (error) {
    console.error('Verify merch payment error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
