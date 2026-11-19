import { sendEmail } from '@/lib/email';
import { newOrderBandEmail, orderConfirmedEmail } from '@/lib/emailTemplates';
import { adjustStock } from '@/lib/merchStock';
import { captureRazorpayPayment, fetchRazorpayPayment, toPaise } from '@/lib/razorpay';

type ConfirmResult =
  | { ok: true; alreadyConfirmed: boolean; emailSent: boolean }
  | { ok: false; error: string };

// Marks a pending order as paid once Razorpay confirms the payment.
// Called from both the browser verify route and the webhook, so it must be safe to run twice:
// only the call that flips the status from pending_payment reduces stock and sends emails.
export async function confirmPaidOrder(supabase: any, order: any, razorpayPaymentId: string): Promise<ConfirmResult> {
  if (order.status !== 'pending_payment') {
    return { ok: true, alreadyConfirmed: true, emailSent: false };
  }

  // Check the payment with Razorpay itself rather than trusting the caller
  const payment = await fetchRazorpayPayment(razorpayPaymentId);
  const expectedAmount = toPaise(order.total_amount);

  if (payment.order_id !== order.razorpay_order_id) {
    return { ok: false, error: 'Payment does not belong to this order.' };
  }
  if (Number(payment.amount) !== expectedAmount) {
    return { ok: false, error: 'Payment amount does not match the order total.' };
  }

  if (payment.status === 'authorized') {
    // Accounts without automatic capture leave payments authorized; capture so the money settles
    await captureRazorpayPayment(razorpayPaymentId, expectedAmount);
  } else if (payment.status !== 'captured') {
    return { ok: false, error: `Payment is ${payment.status}.` };
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('merch_orders')
    .update({
      status: 'confirmed',
      razorpay_payment_id: razorpayPaymentId,
      paid_at: now,
      updated_at: now,
    })
    .eq('id', order.id)
    .eq('status', 'pending_payment')
    .select('id');

  if (updateError) {
    return { ok: false, error: `Order update failed: ${updateError.message}` };
  }
  if (!updated || updated.length === 0) {
    // The other path (webhook or browser) confirmed it first
    return { ok: true, alreadyConfirmed: true, emailSent: false };
  }

  await adjustStock(supabase, order.items, -1);

  const confirmation = orderConfirmedEmail(order, razorpayPaymentId);
  const emailSent = await sendEmail({ to: order.email, ...confirmation });

  if (process.env.ADMIN_EMAIL) {
    const bandAlert = newOrderBandEmail(order, razorpayPaymentId);
    await sendEmail({ to: process.env.ADMIN_EMAIL, replyTo: order.email, ...bandAlert });
  }

  return { ok: true, alreadyConfirmed: false, emailSent };
}
