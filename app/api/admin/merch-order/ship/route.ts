import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAuth';
import { sendEmail } from '@/lib/email';
import { orderShippedEmail } from '@/lib/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

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

    const emailSent = await sendEmail({
      to: order.email,
      ...orderShippedEmail(order, carrier || null, trackingNumber || null),
    });

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Order marked as shipped and customer notified.'
        : 'Order marked as shipped, but the email to the customer could not be sent.',
    });
  } catch (error) {
    console.error('Ship merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
