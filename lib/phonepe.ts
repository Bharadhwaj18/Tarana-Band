import crypto from 'crypto';

// Server-only helpers for PhonePe PG Standard Checkout (v2), using the REST API directly.
// Credentials come from the PhonePe Business dashboard:
//   PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION
//   PHONEPE_ENV = 'sandbox' (test) or 'production' (live). Anything other than 'production' uses sandbox.
//   PHONEPE_WEBHOOK_USERNAME, PHONEPE_WEBHOOK_PASSWORD (set the same values on the webhook in the dashboard)

const IS_PRODUCTION = process.env.PHONEPE_ENV === 'production';

const AUTH_URL = IS_PRODUCTION
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';

const PG_BASE = IS_PRODUCTION
  ? 'https://api.phonepe.com/apis/pg'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

/** Browser script that opens the PhonePe pay page in a frame on our site */
export const PHONEPE_CHECKOUT_SCRIPT = 'https://mercury.phonepe.com/web/bundle/checkout.js';

export function isPhonePeConfigured(): boolean {
  return Boolean(
    process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET && process.env.PHONEPE_CLIENT_VERSION
  );
}

// Access tokens last a while; reuse one until shortly before it expires
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > nowSeconds) return cachedToken.value;

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.PHONEPE_CLIENT_ID || '',
      client_secret: process.env.PHONEPE_CLIENT_SECRET || '',
      client_version: process.env.PHONEPE_CLIENT_VERSION || '',
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.message || `PhonePe login failed (${res.status})`);
  }
  // PhonePe's docs don't say whether expires_at is in seconds or milliseconds, so accept both
  const rawExpiry = Number(data.expires_at);
  const expiresAt = rawExpiry > 1e12 ? Math.floor(rawExpiry / 1000) : rawExpiry;
  cachedToken = { value: data.access_token, expiresAt: expiresAt || nowSeconds + 300 };
  return cachedToken.value;
}

async function phonePeRequest(path: string, method: 'GET' | 'POST', body?: unknown, retried = false): Promise<any> {
  const token = await getAccessToken();
  const res = await fetch(`${PG_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `O-Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  // A rejected token (expired early, or rotated) is refreshed once and the request repeated
  if (res.status === 401 && !retried) {
    cachedToken = null;
    return phonePeRequest(path, method, body, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.code || `PhonePe request failed (${res.status})`);
  }
  return data;
}

/**
 * Starts a payment. merchantOrderId is our own order id; amounts are in paise (Rs. 1 = 100 paise).
 * Returns PhonePe's order id and the pay page URL the browser opens.
 */
export async function createPhonePePayment(params: {
  merchantOrderId: string;
  amountPaise: number;
  redirectUrl: string;
}): Promise<{ orderId: string; redirectUrl: string }> {
  const data = await phonePeRequest('/checkout/v2/pay', 'POST', {
    merchantOrderId: params.merchantOrderId,
    amount: params.amountPaise,
    expireAfter: 1200,
    paymentFlow: {
      type: 'PG_CHECKOUT',
      message: 'Tarana merch order',
      merchantUrls: { redirectUrl: params.redirectUrl },
    },
  });
  if (!data?.redirectUrl) throw new Error('PhonePe did not return a payment page.');
  return { orderId: String(data.orderId || ''), redirectUrl: String(data.redirectUrl) };
}

export interface PhonePeOrderStatus {
  orderId: string;
  state: 'PENDING' | 'FAILED' | 'COMPLETED' | string;
  amount: number;
  transactionId: string | null;
  paymentMode: string | null;
}

/** Asks PhonePe directly whether an order was paid; never trust the browser for this */
export async function getPhonePeOrderStatus(merchantOrderId: string): Promise<PhonePeOrderStatus> {
  const data = await phonePeRequest(
    `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`,
    'GET'
  );
  const attempts: any[] = Array.isArray(data?.paymentDetails) ? data.paymentDetails : [];
  const paid = attempts.find((attempt) => attempt?.state === 'COMPLETED') || attempts[attempts.length - 1];
  return {
    orderId: String(data?.orderId || ''),
    state: String(data?.state || ''),
    amount: Number(data?.amount),
    transactionId: paid?.transactionId ? String(paid.transactionId) : null,
    paymentMode: paid?.paymentMode ? String(paid.paymentMode) : null,
  };
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * PhonePe signs webhooks with an Authorization header of SHA256("username:password").
 * We accept the hex hash with or without a scheme word in front of it.
 */
export function isValidPhonePeWebhook(authorizationHeader: string): boolean {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password || !authorizationHeader) return false;
  const expected = crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');
  const received = authorizationHeader.trim().split(/\s+/).pop()!.toLowerCase();
  return safeEqual(expected, received);
}

export function toPaise(amountRupees: number) {
  return Math.round(Number(amountRupees) * 100);
}
