import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { adjustStock } from '@/lib/merchStock';
import { getProofExtension, validateProofImage } from '@/lib/uploads';

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

    const proofError = validateProofImage(paymentProof);
    if (proofError) {
      return NextResponse.json({ error: proofError }, { status: 400 });
    }

    let cartItems: any[] = [];
    try {
      cartItems = JSON.parse(itemsRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid cart data.' }, { status: 400 });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Prices and stock come from the database, never from the browser
    const productIds = Array.from(new Set(cartItems.map((item) => String(item?.product?.id || ''))));
    const { data: products, error: productsError } = await supabase
      .from('merchandise')
      .select('id, name, price, is_active, size_stock, image_url')
      .in('id', productIds);

    if (productsError) {
      return NextResponse.json({ error: 'Could not verify your cart. Please try again.' }, { status: 500 });
    }

    const items: any[] = [];
    const requested: Record<string, number> = {};
    let calculatedTotal = 0;

    for (const cartItem of cartItems) {
      const product = (products || []).find((p: any) => p.id === cartItem?.product?.id);
      const size = String(cartItem?.size || '');
      const quantity = Number(cartItem?.quantity);

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: `${cartItem?.product?.name || 'An item'} is no longer available. Please refresh and try again.` },
          { status: 400 }
        );
      }
      if (!size || !Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ error: 'Invalid cart data.' }, { status: 400 });
      }

      const stock = product.size_stock;
      if (stock && Object.keys(stock).length > 0) {
        const key = `${product.id}:${size}`;
        requested[key] = (requested[key] || 0) + quantity;
        const available = Number(stock[size] ?? 0);
        if (requested[key] > available) {
          return NextResponse.json(
            {
              error:
                available > 0
                  ? `Only ${available} left of ${product.name} (${size}). Please update your cart.`
                  : `${product.name} (${size}) is sold out. Please update your cart.`,
            },
            { status: 400 }
          );
        }
      }

      calculatedTotal += Number(product.price) * quantity;
      items.push({
        product: { id: product.id, name: product.name, price: product.price, image_url: product.image_url },
        size,
        quantity,
      });
    }

    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Prices have changed since you opened this page. Please refresh and try again.' },
        { status: 400 }
      );
    }

    const proofPath = `merch-payment-proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${getProofExtension(paymentProof)}`;

    const uploadResult = await supabase.storage
      .from('photos')
      .upload(proofPath, paymentProof, {
        upsert: false,
        contentType: paymentProof.type,
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
        total_amount: calculatedTotal,
        payment_proof_url: paymentProofUrl,
        payment_proof_path: proofPath,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: `Failed to save order: ${insertError.message}` }, { status: 500 });
    }

    // Decrement stock for each item
    await adjustStock(supabase, items, -1);

    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.product?.name || 'Item'} - Size: ${item.size} - Qty: ${item.quantity}</li>`
      )
      .join('');

    const emailSent = await sendEmail({
      to: email,
      subject: 'Your Tarana Merchandise Order is Confirmed',
      html: `
        <h2>Order Confirmed</h2>
        <p>Hi ${fullName}, your order has been received successfully.</p>
        <p><strong>Total:</strong> Rs. ${calculatedTotal.toFixed(2)}</p>
        <ul>${itemsHtml}</ul>
        <p>Shipping will be done via India Post.</p>
      `,
    });

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New Merch Order - ${fullName}`,
        html: `
          <h2>New Merch Order</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Address:</strong> ${addressLine1}, ${addressLine2}, ${city}, ${state} - ${pincode}</p>
          <p><strong>Total:</strong> Rs. ${calculatedTotal.toFixed(2)}</p>
          <ul>${itemsHtml}</ul>
          <p><a href="${paymentProofUrl}">View Payment Proof</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, emailSent, message: 'Order placed successfully.' });
  } catch (error) {
    console.error('Merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
