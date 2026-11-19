import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRazorpayOrder, getRazorpayKeyId, isRazorpayConfigured, toPaise } from '@/lib/razorpay';
import { isPageEnabled } from '@/lib/pageVisibility';

// Starts checkout: checks the cart against the database, saves the order as pending_payment
// and creates the matching Razorpay order. The order is only confirmed after payment
// (see /api/merch-order/verify and /api/razorpay/webhook).
export async function POST(request: NextRequest) {
  try {
    // No new orders while the merch page is switched off in admin
    if (!(await isPageEnabled('show_merch'))) {
      return NextResponse.json({ error: 'The merch store is closed right now.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const fullName = String(body.fullName || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const addressLine1 = String(body.addressLine1 || '').trim();
    const addressLine2 = String(body.addressLine2 || '').trim();
    const city = String(body.city || '').trim();
    const state = String(body.state || '').trim();
    const pincode = String(body.pincode || '').trim();
    const totalAmount = Number(body.totalAmount || 0);
    const cartItems = body.items;

    if (!fullName || !phone || !email || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({ error: 'Missing required checkout fields.' }, { status: 400 });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
    }
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Online payments are not set up yet.' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Prices and stock come from the database, never from the browser
    const productIds = Array.from(new Set(cartItems.map((item: any) => String(item?.product?.id || ''))));
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

    const now = new Date().toISOString();
    const { data: order, error: insertError } = await supabase
      .from('merch_orders')
      .insert([
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
          status: 'pending_payment',
          created_at: now,
          updated_at: now,
        },
      ])
      .select('id')
      .single();

    if (insertError || !order) {
      return NextResponse.json({ error: `Failed to save order: ${insertError?.message || 'unknown error'}` }, { status: 500 });
    }

    const amountPaise = toPaise(calculatedTotal);
    let razorpayOrder: any;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountPaise,
        receipt: order.id,
        notes: { merch_order_id: order.id },
      });
    } catch (error: any) {
      // Remove the pending order so it doesn't linger without a payment attached
      await supabase.from('merch_orders').delete().eq('id', order.id).eq('status', 'pending_payment');
      console.error('Razorpay order creation failed:', error);
      return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 502 });
    }

    const { error: linkError } = await supabase
      .from('merch_orders')
      .update({ razorpay_order_id: razorpayOrder.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (linkError) {
      return NextResponse.json({ error: `Failed to save order: ${linkError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: getRazorpayKeyId(),
    });
  } catch (error) {
    console.error('Merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
