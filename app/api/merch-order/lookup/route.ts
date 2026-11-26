import { NextRequest, NextResponse } from 'next/server';
import { looksLikeEmail, ordersForEmail } from '@/lib/customerOrders';
import { orderPath } from '@/lib/orderAccess';
import { allow, clientIp } from '@/lib/rateLimit';

// Order number + email. Both have to match: the number alone (it is only the start of the order id) opens nothing.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || '').trim();
    const number = String(body?.orderNumber || '').replace(/[^0-9a-z]/gi, '').toUpperCase();

    if (!looksLikeEmail(email) || number.length < 6) {
      return NextResponse.json({ error: 'Enter the order number from your confirmation email and the email you ordered with.' }, { status: 400 });
    }
    if (!allow(`lookup-ip:${clientIp(request)}`, 20, 60 * 60_000)) {
      return NextResponse.json({ error: 'Too many tries. Please wait a little while and try again.' }, { status: 429 });
    }

    const orders = await ordersForEmail(email);
    const order = orders.find((o) => o.id.replace(/-/g, '').toUpperCase().startsWith(number));
    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find an order with that number and email. Check the confirmation email, or ask for a link to all your orders." },
        { status: 404 }
      );
    }
    return NextResponse.json({ url: orderPath(order.id) });
  } catch (error) {
    console.error('Order lookup error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
