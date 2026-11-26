import crypto from 'crypto';
import { SITE_URL } from './seo';

// Customers have no accounts, so access to an order is a signed link instead of a login:
//   - a "view this order" link, one per order, put in every order email
//   - a "my orders" link, sent to an email address and valid for an hour
// Links are signed with a key derived from the server's database key, so nothing new has to be set up,
// and nobody can build a link for someone else's order.

const HISTORY_LINK_MINUTES = 60;

function key(): Buffer {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error('Order links are not set up (no server key).');
  return crypto.createHash('sha256').update(`tarana-order-links|${base}`).digest();
}

function sign(data: string): string {
  return crypto.createHmac('sha256', key()).update(data).digest('base64url');
}

function same(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function orderToken(orderId: string): string {
  return sign(`order|${orderId}`);
}

export function isValidOrderToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    return same(orderToken(orderId), token);
  } catch {
    return false;
  }
}

/** Path (no domain) that opens one order */
export function orderPath(orderId: string): string {
  return `/merch/orders/${orderId}?t=${orderToken(orderId)}`;
}

/** Full link for emails. Null if links aren't set up, so an email still goes out without the button. */
export function orderViewUrl(orderId: string): string | null {
  try {
    return `${SITE_URL}${orderPath(orderId)}`;
  } catch {
    return null;
  }
}

export const HISTORY_LINK_VALID_FOR = `${HISTORY_LINK_MINUTES} minutes`;

export function historyUrl(email: string): string {
  const payload = `${Buffer.from(email.trim().toLowerCase()).toString('base64url')}.${Date.now() + HISTORY_LINK_MINUTES * 60_000}`;
  return `${SITE_URL}/merch/orders?t=${payload}.${sign(`history|${payload}`)}`;
}

/** The email address a "my orders" link was made for, or null if it's invalid or has expired */
export function readHistoryToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [emailPart, expiry, signature] = parts;
  try {
    if (!same(sign(`history|${emailPart}.${expiry}`), signature)) return null;
    if (!(Number(expiry) > Date.now())) return null;
    return Buffer.from(emailPart, 'base64url').toString('utf8') || null;
  } catch {
    return null;
  }
}
