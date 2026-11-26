// Server-only link to Rigly (the band's Setlist Manager), which owns merch stock and records the money.
//   RIGLY_URL      e.g. https://tarana-setlist-manager.vercel.app
//   STORE_API_KEY  shared secret, the same value in Rigly's and this site's environment
// Rigly also calls this site back (ship / cancel from Rigly) with the same secret: see isRiglyRequest.

import crypto from 'crypto';

export interface RiglyVariant {
  id: string;
  label: string;
  stock: number;
  inKits: number;
  /** What can be sold online: stock minus units out in kits */
  available: number;
}

export interface RiglyItem {
  id: string;
  name: string;
  kind: string | null;
  variants: RiglyVariant[];
}

const riglyUrl = () => (process.env.RIGLY_URL || '').replace(/\/+$/, '');

export function isRiglyConfigured(): boolean {
  return Boolean(riglyUrl() && process.env.STORE_API_KEY);
}

async function riglyRequest(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}) {
  if (!isRiglyConfigured()) throw new Error('Rigly is not linked (RIGLY_URL / STORE_API_KEY missing).');
  const res = await fetch(`${riglyUrl()}${path}`, {
    method: init.method || 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.STORE_API_KEY}` },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Rigly request failed (${res.status})`);
  return data;
}

/** Every live item and size in Rigly with what's available to sell online */
export async function getRiglyStock(): Promise<RiglyItem[]> {
  const data = await riglyRequest('/api/store/stock');
  return Array.isArray(data?.items) ? data.items : [];
}

interface OrderLine {
  product?: { id?: string; name?: string; price?: number };
  size: string;
  quantity: number;
  variant_id?: string;
}

/**
 * Saves a paid order in Rigly: the order, a pending online sale (money held by whoever receives the online payments) and the stock moves.
 * Safe to call more than once for the same order.
 */
export async function pushOrderToRigly(order: any, paymentRef: string | null) {
  const lines = ((order.items || []) as OrderLine[]).map((item) => ({
    variantId: item.variant_id,
    item: item.product?.name || null,
    label: item.size || null,
    qty: item.quantity || 1,
    price: item.product?.price ?? null,
  }));
  if (lines.some((l) => !l.variantId)) {
    throw new Error('Order has items that are not linked to Rigly sizes.');
  }
  return riglyRequest('/api/store/orders', {
    method: 'POST',
    body: {
      websiteOrderId: order.id,
      total: Number(order.total_amount),
      paymentRef,
      paidAt: order.paid_at || new Date().toISOString(),
      customer: {
        name: order.customer_name,
        email: order.email,
        phone: order.phone,
        address: [order.address_line1, order.address_line2].filter(Boolean).join(', '),
        city: order.city,
        state: order.state,
        pincode: order.pincode,
      },
      lines,
    },
  });
}

/** Tells Rigly an order was shipped or cancelled. Cancelling puts the stock back in Rigly. */
export async function pushOrderStatusToRigly(
  websiteOrderId: string,
  status: 'shipped' | 'cancelled',
  details: { tracking?: string | null; reason?: string | null } = {}
) {
  return riglyRequest('/api/store/orders/status', {
    method: 'POST',
    body: { websiteOrderId, status, tracking: details.tracking || undefined, reason: details.reason || undefined },
  });
}

/** True when a request to this site comes from Rigly (signed with the shared secret) */
export function isRiglyRequest(authorizationHeader: string | null): boolean {
  const key = process.env.STORE_API_KEY;
  const sent = (authorizationHeader || '').replace(/^Bearer\s+/i, '');
  if (!key || !sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(key);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
