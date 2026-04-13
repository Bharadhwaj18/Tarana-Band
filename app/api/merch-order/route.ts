import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const fullName = String(formData.get('fullName') || '');
    const phone = String(formData.get('phone') || '');
    const email = String(formData.get('email') || '');
    const addressLine1 = String(formData.get('addressLine1') || '');
    const addressLine2 = String(formData.get('addressLine2') || '');
    const city = String(formData.get('city') || '');
    const state = String(formData.get('state') || '');
    const pincode = String(formData.get('pincode') || '');
    const totalAmount = Number(formData.get('totalAmount') || 0);
    const itemsRaw = String(formData.get('items') || '[]');
    const paymentProof = formData.get('paymentProof') as File | null;

    if (!fullName || !phone || !email || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({ error: 'Missing required checkout fields.' }, { status: 400 });
    }
    if (!paymentProof) {
      return NextResponse.json({ error: 'Payment proof is required.' }, { status: 400 });
    }

    let items: any[] = [];
    try {
      items = JSON.parse(itemsRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid cart data.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const proofExt = paymentProof.name.split('.').pop() || 'jpg';
    const proofPath = `merch-payment-proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${proofExt}`;

    const uploadResult = await supabase.storage
      .from('photos')
      .upload(proofPath, paymentProof, {
        upsert: false,
        contentType: paymentProof.type || 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadResult.error) {
      return NextResponse.json({ error: `Payment proof upload failed: ${uploadResult.error.message}` }, { status: 500 });
    }

    const { data: proofUrlData } = supabase.storage.from('photos').getPublicUrl(proofPath);
    const paymentProofUrl = proofUrlData.publicUrl;

    const { error: insertError } = await supabase.from('merch_orders').insert([
      {
        customer_name: fullName,
        phone,
        email,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state,
        pincode,
        items,
        total_amount: totalAmount,
        payment_proof_url: paymentProofUrl,
        payment_proof_path: proofPath,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: `Failed to save order: ${insertError.message}` }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const adminEmail = process.env.ADMIN_EMAIL || 'noreply@resend.dev';

      const itemsHtml = items
        .map(
          (item) =>
            `<li>${item.product?.name || 'Item'} - Size: ${item.size} - Qty: ${item.quantity}</li>`
        )
        .join('');

      await resend.emails.send({
        from: 'Tarana Band <onboarding@resend.dev>',
        to: email,
        subject: 'Your Tarana Merchandise Order is Confirmed',
        html: `
          <h2>Order Confirmed</h2>
          <p>Hi ${fullName}, your order has been received successfully.</p>
          <p><strong>Total:</strong> Rs. ${totalAmount.toFixed(2)}</p>
          <ul>${itemsHtml}</ul>
          <p>Shipping will be done via India Post.</p>
        `,
      });

      await resend.emails.send({
        from: 'Tarana Band <onboarding@resend.dev>',
        to: adminEmail,
        subject: `New Merch Order - ${fullName}`,
        html: `
          <h2>New Merch Order</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Address:</strong> ${addressLine1}, ${addressLine2}, ${city}, ${state} - ${pincode}</p>
          <p><strong>Total:</strong> Rs. ${totalAmount.toFixed(2)}</p>
          <ul>${itemsHtml}</ul>
          <p><a href="${paymentProofUrl}">View Payment Proof</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'Order placed successfully.' });
  } catch (error) {
    console.error('Merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
