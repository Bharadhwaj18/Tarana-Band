import crypto from 'crypto';

// Server-only helpers for Razorpay Standard Checkout, using the REST API directly.
// Credentials come from the Razorpay dashboard -> Account & Settings -> API keys:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET  (rzp_test_... for test mode, rzp_live_... once live)
//   RAZORPAY_WEBHOOK_SECRET               (the secret you type when adding the webhook in the dashboard)

const API = 'https://api.razorpay.com/v1';

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** The public key id the browser needs to open the pay window. Safe to expose; the secret never leaves the server. */
export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || '';
}

async function razorpayRequest(path: string, method: 'GET' | 'POST', body?: unknown, attempt = 0): Promise<any> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (error) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      return razorpayRequest(path, method, body, attempt + 1);
    }
    throw error;
  }
  // A 5xx is retried. Repeating a status check is harmless, and a repeated order create only leaves an unused order.
  if (res.status >= 500 && attempt < 2) {
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    return razorpayRequest(path, method, body, attempt + 1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.description || data?.error?.code || `Razorpay request failed (${res.status})`);
  }
  return data;
}

/**
 * Creates the Razorpay order a payment is made against. `receipt` and `notes.order_id` carry our own order id;
 * amounts are in paise (Rs. 1 = 100 paise). The browser opens the pay window with the returned id.
 */
export async function createRazorpayOrder(params: { orderId: string; amountPaise: number }): Promise<{ id: string }> {
  const data = await razorpayRequest('/orders', 'POST', {
    amount: params.amountPaise,
    currency: 'INR',
    receipt: params.orderId,
    notes: { order_id: params.orderId },
  });
  if (!data?.id) throw new Error('Razorpay did not return an order.');
  return { id: String(data.id) };
}

export interface RazorpayPaymentStatus {
  /** COMPLETED = money captured, PENDING = still going through, FAILED = no successful payment (yet) */
  state: 'COMPLETED' | 'PENDING' | 'FAILED';
  orderId: string;
  /** What the customer paid, in paise */
  amount: number;
  paymentId: string | null;
  method: string | null;
  /** Razorpay's fee and the tax on it, in paise. What reaches the bank is amount - fee - tax. Null until Razorpay has them. */
  fee: number | null;
  tax: number | null;
}

/** Asks Razorpay directly whether an order was paid; never trust the browser or the webhook body for this */
export async function getRazorpayPaymentStatus(razorpayOrderId: string): Promise<RazorpayPaymentStatus> {
  const data = await razorpayRequest(`/orders/${encodeURIComponent(razorpayOrderId)}/payments`, 'GET');
  const payments: any[] = Array.isArray(data?.items) ? data.items : [];

  const captured = payments.find((p) => p?.status === 'captured');
  const inFlight = payments.find((p) => p?.status === 'authorized' || p?.status === 'created');
  const shown = captured || inFlight || payments[payments.length - 1];

  const num = (value: unknown) => (value === null || value === undefined || value === '' ? null : Number(value));
  return {
    state: captured ? 'COMPLETED' : inFlight ? 'PENDING' : 'FAILED',
    orderId: razorpayOrderId,
    amount: Number(shown?.amount),
    paymentId: shown?.id ? String(shown.id) : null,
    method: shown?.method ? String(shown.method) : null,
    fee: captured ? num(captured.fee) : null,
    tax: captured ? num(captured.tax) : null,
  };
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/** Razorpay signs each webhook: the X-Razorpay-Signature header is HMAC-SHA256 of the raw body with the webhook secret */
export function isValidRazorpayWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature.trim().toLowerCase());
}

export function toPaise(amountRupees: number) {
  return Math.round(Number(amountRupees) * 100);
}
