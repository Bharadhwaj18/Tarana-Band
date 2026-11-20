import { sendEmail } from '@/lib/email';
import { newOrderBandEmail, orderConfirmedEmail } from '@/lib/emailTemplates';
import { adjustStock } from '@/lib/merchStock';
import { getPhonePeOrderStatus, toPaise } from '@/lib/phonepe';

type ConfirmResult =
  | { ok: true; alreadyConfirmed: boolean; emailSent: boolean }
  | { ok: false; state: 'PENDING' | 'FAILED' | 'ERROR'; error: string };

// An order waits in pending_payment while the customer pays. If PhonePe says the payment failed or expired it
// becomes payment_failed, but can still be confirmed if a late success arrives, so money is never taken for a lost order.
const OPEN_STATUSES = ['pending_payment', 'payment_failed'];

// How long after starting a payment we stop treating it as in progress (PhonePe order expiry is 20 min)
const STALE_AFTER_MS = 25 * 60 * 1000;

// Marks a pending order as paid once PhonePe confirms the payment.
// Called from the browser verify route, the webhook and the stale-order sweep, so it must be safe to run twice:
// only the call that flips the status to confirmed reduces stock and sends emails.
export async function confirmPaidOrder(supabase: any, order: any): Promise<ConfirmResult> {
  if (!OPEN_STATUSES.includes(order.status)) {
    return { ok: true, alreadyConfirmed: true, emailSent: false };
  }

  // Ask PhonePe itself rather than trusting the browser or the webhook body
  const payment = await getPhonePeOrderStatus(order.id);

  if (payment.state === 'PENDING') {
    return { ok: false, state: 'PENDING', error: 'Payment is still processing.' };
  }
  if (payment.state !== 'COMPLETED') {
    if (order.status === 'pending_payment') {
      await supabase
        .from('merch_orders')
        .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
        .eq('id', order.id)
        .eq('status', 'pending_payment');
    }
    return { ok: false, state: 'FAILED', error: 'Payment was not completed.' };
  }
  if (payment.amount !== toPaise(order.total_amount)) {
    return { ok: false, state: 'ERROR', error: 'Payment amount does not match the order total.' };
  }

  const paymentId = payment.transactionId || payment.orderId;
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('merch_orders')
    .update({
      status: 'confirmed',
      payment_gateway: 'phonepe',
      gateway_order_id: payment.orderId || order.gateway_order_id || null,
      gateway_payment_id: paymentId,
      paid_at: now,
      updated_at: now,
    })
    .eq('id', order.id)
    .in('status', OPEN_STATUSES)
    .select('id');

  if (updateError) {
    return { ok: false, state: 'ERROR', error: `Order update failed: ${updateError.message}` };
  }
  if (!updated || updated.length === 0) {
    // The other path (webhook or browser) confirmed it first
    return { ok: true, alreadyConfirmed: true, emailSent: false };
  }

  await adjustStock(supabase, order.items, -1);

  const confirmation = orderConfirmedEmail(order, paymentId);
  const emailSent = await sendEmail({ to: order.email, ...confirmation });

  if (process.env.ADMIN_EMAIL) {
    const bandAlert = newOrderBandEmail(order, paymentId);
    await sendEmail({ to: process.env.ADMIN_EMAIL, replyTo: order.email, ...bandAlert });
  }

  return { ok: true, alreadyConfirmed: false, emailSent };
}

/** Looks up an order by id and checks its payment with PhonePe */
export async function reconcileOrderById(supabase: any, orderId: string) {
  const { data: order } = await supabase.from('merch_orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return null;
  return confirmPaidOrder(supabase, order);
}

/**
 * Settles checkouts that were abandoned or never reported back: anything still pending after the PhonePe
 * order has expired is checked once, then confirmed (if it was paid after all) or marked payment_failed.
 * Runs whenever a new order starts, so no scheduled job is needed.
 */
export async function reconcileStaleOrders(supabase: any, limit = 5) {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const { data: stale } = await supabase
    .from('merch_orders')
    .select('*')
    .eq('status', 'pending_payment')
    .eq('payment_gateway', 'phonepe')
    .lt('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(limit);

  for (const order of stale || []) {
    try {
      await confirmPaidOrder(supabase, order);
    } catch (error) {
      console.error('Could not reconcile stale order', order.id, error);
    }
  }
}
