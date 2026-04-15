import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { orderId, trackingNumber, carrier } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase server config is missing.' }, { status: 500 });
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

    if (order.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Order cannot be shipped — current status is "${order.status}".` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('merch_orders')
      .update({
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        tracking_number: trackingNumber || null,
        carrier: carrier || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json({ error: `Order update failed: ${updateError.message}` }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY && order.email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const itemsList = (order.items || [])
        .map((item: any) =>
          `<li>${item.product?.name || 'Item'} — Size: ${item.size} × ${item.quantity}</li>`
        )
        .join('');

      const trackingBlock =
        trackingNumber || carrier
          ? `
            <div style="margin-top:16px;padding:12px;background:#f5f5f5;border-radius:6px;">
              <strong>Shipment Details</strong><br/>
              ${carrier ? `Carrier: ${carrier}<br/>` : ''}
              ${trackingNumber ? `Tracking Number: <strong>${trackingNumber}</strong>` : ''}
            </div>`
          : '';

      await resend.emails.send({
        from: 'Tarana Band <onboarding@resend.dev>',
        to: order.email,
        subject: 'Your Tarana Merch Order Has Been Shipped!',
        html: `
          <h2>Your order is on its way!</h2>
          <p>Hello ${order.customer_name || 'Customer'},</p>
          <p>Great news — your Tarana merchandise order has been shipped.</p>
          <p><strong>Items Shipped:</strong></p>
          <ul>${itemsList}</ul>
          ${trackingBlock}
          <p style="margin-top:16px;">If you have any questions about your order, please reply to this email.</p>
          <p>Thank you for supporting Tarana!</p>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'Order marked as shipped and email sent.' });
  } catch (error) {
    console.error('Ship merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
