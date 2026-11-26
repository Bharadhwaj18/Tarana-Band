import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { orderHistoryEmail } from '@/lib/emailTemplates';
import { historyUrl } from '@/lib/orderAccess';
import { looksLikeEmail, ordersForEmail } from '@/lib/customerOrders';
import { allow, clientIp } from '@/lib/rateLimit';

// "Email me a link to my orders". The answer is the same whether or not the address has orders, so this can't be
// used to find out who has ordered, and only an address that really has orders is ever emailed.
const SAME_ANSWER = { ok: true };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || '').trim();
    if (!looksLikeEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Limits per person and per address, so the form can't be used to flood an inbox
    if (!allow(`history-ip:${clientIp(request)}`, 10, 60 * 60_000) || !allow(`history-email:${email.toLowerCase()}`, 3, 60 * 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again in a little while.' }, { status: 429 });
    }

    const orders = await ordersForEmail(email);
    if (orders.length > 0) {
      await sendEmail({ to: email, ...orderHistoryEmail(orders[0].customer_name || null, historyUrl(email)) });
    }
    return NextResponse.json(SAME_ANSWER);
  } catch (error) {
    console.error('Order history link error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
