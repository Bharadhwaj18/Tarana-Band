import { sendEmail } from '@/lib/email';
import { newOrderBandEmail, orderConfirmedEmail } from '@/lib/emailTemplates';
import { adjustStock } from '@/lib/merchStock';
import { getPhonePeOrderStatus, toPaise } from '@/lib/phonepe';

type ConfirmResult =
  | { ok: true; alreadyConfirmed: boolean; emailSent: boolean }
  | { ok: false; state: 'PENDING' | 'FAILED' | 'ERROR'; error: string };

// Marks a pending order as paid once PhonePe confirms the payment.
// Called from both the browser verify route and the webhook, so it must be safe to run twice:
// only the call that flips the status from pending_payment reduces stock and sends emails.
export async function confirmPaidOrder(supabase: any, order: any): Promise<ConfirmResult> {
  if (order.status !== 'pending_payment') {
    return { ok: true, alreadyConfirmed: true, emailSent: false };
  }

  // Ask PhonePe itself rather than trusting the browser or the webhook body
  const payment = await getPhonePeOrderStatus(order.id);

  if (payment.state === 'PENDING') {
    return { ok: false, state: 'PENDING', error: 'Payment is still processing.' };
  }
  if (payment.state !== 'COMPLETED') {
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
    .eq('status', 'pending_payment')
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
