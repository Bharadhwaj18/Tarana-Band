import crypto from 'crypto';

// Server-only helpers for Razorpay Standard Checkout, using the REST API directly.
// Keys come from RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (test keys start with rzp_test_).

const API_BASE = 'https://api.razorpay.com/v1';

export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID || null;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

async function razorpayRequest(path: string, method: 'GET' | 'POST', body?: unknown) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.description || `Razorpay request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// Amounts are in paise (Rs. 1 = 100 paise)
export function createRazorpayOrder(params: { amountPaise: number; receipt: string; notes?: Record<string, string> }) {
  return razorpayRequest('/orders', 'POST', {
    amount: params.amountPaise,
    currency: 'INR',
    receipt: params.receipt,
    notes: params.notes,
  });
}

export function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, 'GET');
}

export function captureRazorpayPayment(paymentId: string, amountPaise: number) {
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, 'POST', {
    amount: amountPaise,
    currency: 'INR',
  });
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Signature Razorpay returns to the browser after a successful payment
export function isValidPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  if (!process.env.RAZORPAY_KEY_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

// Signature on webhook calls, computed over the raw request body
export function isValidWebhookSignature(rawBody: string, signature: string) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return safeEqual(expected, signature);
}

export function toPaise(amountRupees: number) {
  return Math.round(Number(amountRupees) * 100);
}
