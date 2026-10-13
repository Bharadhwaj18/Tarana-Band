import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAuth';
import { sendEmail } from '@/lib/email';
import { adjustStock } from '@/lib/merchStock';
import { getProofExtension, validateProofImage } from '@/lib/uploads';

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const orderId = String(formData.get('orderId') || '');
    const reason = String(formData.get('reason') || '');
    const refundProof = formData.get('refundProof') as File | null;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }
    if (!refundProof) {
      return NextResponse.json({ error: 'Refund proof is required.' }, { status: 400 });
    }
    const proofError = validateProofImage(refundProof);
    if (proofError) {
      return NextResponse.json({ error: proofError }, { status: 400 });
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

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled.' }, { status: 400 });
    }

    const proofPath = `merch-refund-proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${getProofExtension(refundProof)}`;

    const uploadResult = await supabase.storage
      .from('photos')
      .upload(proofPath, refundProof, {
        upsert: false,
        contentType: refundProof.type,
        cacheControl: '3600',
      });

    if (uploadResult.error) {
      return NextResponse.json({ error: `Refund proof upload failed: ${uploadResult.error.message}` }, { status: 500 });
    }

    const { data: refundUrlData } = supabase.storage.from('photos').getPublicUrl(proofPath);
    const refundProofUrl = refundUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('merch_orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        refund_proof_url: refundProofUrl,
        refund_proof_path: proofPath,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      // Don't leave an orphaned proof behind when the order wasn't cancelled
      await supabase.storage.from('photos').remove([proofPath]);
      return NextResponse.json({ error: `Order update failed: ${updateError.message}` }, { status: 500 });
    }

    // Put the cancelled items back into stock
    await adjustStock(supabase, order.items, 1);

    const emailSent = await sendEmail({
      to: order.email,
      subject: 'Your Tarana Merch Order Has Been Cancelled',
      html: `
        <h2>Order Cancelled</h2>
        <p>Hello ${order.customer_name || 'Customer'},</p>
        <p>Your merchandise order has been cancelled.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>We have processed your refund. You can view refund proof here:</p>
        <p><a href="${refundProofUrl}">View Refund Proof</a></p>
        <p>If you have any questions, please reply to this email.</p>
      `,
    });

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Order cancelled and customer notified.'
        : 'Order cancelled, but the email to the customer could not be sent.',
      refundProofUrl,
    });
  } catch (error) {
    console.error('Cancel merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
