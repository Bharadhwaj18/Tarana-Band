import { createClient } from '@supabase/supabase-js';

// What a customer is allowed to see about their own orders. Server-only: it uses the service key, so the
// columns are listed here on purpose (nothing internal such as Rigly sync state is ever sent to the browser).

export interface CustomerOrder {
  id: string;
  status: 'confirmed' | 'shipped' | 'cancelled';
  items: Array<{ product?: { name?: string; price?: number }; size?: string; quantity?: number }>;
  total_amount: number;
  customer_name: string;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  paid_at: string | null;
  created_at: string;
  shipped_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_proof_url: string | null;
  gateway_payment_id: string | null;
  payment_gateway: string | null;
}

const COLUMNS =
  'id,status,items,total_amount,customer_name,email,address_line1,address_line2,city,state,pincode,paid_at,created_at,shipped_at,tracking_number,carrier,cancelled_at,cancellation_reason,refund_proof_url,gateway_payment_id,payment_gateway';

// Orders that were never paid (abandoned or failed checkouts) are not "orders" to a customer
const VISIBLE_STATUSES = ['confirmed', 'shipped', 'cancelled'];

function db() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase is not configured.');
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function looksLikeEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** All paid orders placed with this email address (matched without caring about upper/lower case), newest first */
export async function ordersForEmail(email: string): Promise<CustomerOrder[]> {
  const wanted = email.trim();
  if (!looksLikeEmail(wanted)) return [];
  // ilike treats % and _ as wildcards, and _ is common in email addresses, so escape them
  const pattern = wanted.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data, error } = await db()
    .from('merch_orders')
    .select(COLUMNS)
    .ilike('email', pattern)
    .in('status', VISIBLE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  // Belt and braces: only keep exact matches
  return ((data as any[]) || []).filter((o) => String(o.email || '').trim().toLowerCase() === wanted.toLowerCase());
}

export async function orderById(id: string): Promise<CustomerOrder | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db().from('merch_orders').select(COLUMNS).eq('id', id).in('status', VISIBLE_STATUSES).maybeSingle();
  return (data as CustomerOrder) || null;
}
