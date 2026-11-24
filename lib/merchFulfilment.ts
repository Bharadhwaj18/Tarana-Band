import { sendEmail } from '@/lib/email';
import { orderCancelledEmail, orderShippedEmail } from '@/lib/emailTemplates';
import { pushOrderStatusToRigly } from '@/lib/rigly';
import { getProofExtension, validateProofImage } from '@/lib/uploads';

// Shipping and cancelling an order, the same way whether the button was pressed in this site's admin or in Rigly:
// update the order here, email the customer, then tell Rigly (which keeps the stock and the money).

type Outcome =
  | { ok: true; emailSent: boolean; riglySynced: boolean; rigly: any; message: string; refundProofUrl?: string | null }
  | { ok: false; status: number; error: string };

async function tellRigly(supabase: any, order: any, status: 'shipped' | 'cancelled', details: { tracking?: string | null; reason?: string | null }) {
  // Orders that never reached Rigly (unpaid, or from before the link) have nothing to update there
  if (order.rigly_sync !== 'done') {
    if (status === 'cancelled' && order.rigly_sync === 'pending') {
      await supabase.from('merch_orders').update({ rigly_sync: 'skipped' }).eq('id', order.id);
    }
    return { synced: true, data: null };
  }
  try {
    const data = await pushOrderStatusToRigly(order.id, status, details);
    return { synced: true, data };
  } catch (error: any) {
    console.error(`Could not mark order ${order.id} ${status} in Rigly:`, error);
    await supabase
      .from('merch_orders')
      .update({ rigly_error: `Rigly not updated (${status}): ${String(error?.message || error)}`.slice(0, 500) })
      .eq('id', order.id);
    return { synced: false, data: null };
  }
}

export async function shipOrder(
  supabase: any,
  orderId: string,
  details: { trackingNumber?: string | null; carrier?: string | null }
): Promise<Outcome> {
  const { data: order } = await supabase.from('merch_orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, status: 404, error: 'Order not found.' };
  if (order.status !== 'confirmed') {
    return { ok: false, status: 400, error: `Order cannot be shipped — current status is "${order.status}".` };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('merch_orders')
    .update({
      status: 'shipped',
      shipped_at: now,
      tracking_number: details.trackingNumber || null,
      carrier: details.carrier || null,
      updated_at: now,
    })
    .eq('id', orderId)
    .eq('status', 'confirmed');
  if (updateError) return { ok: false, status: 500, error: `Order update failed: ${updateError.message}` };

  const emailSent = await sendEmail({
    to: order.email,
    ...orderShippedEmail(order, details.carrier || null, details.trackingNumber || null),
  });
  const rigly = await tellRigly(supabase, order, 'shipped', { tracking: details.trackingNumber });

  return {
    ok: true,
    emailSent,
    riglySynced: rigly.synced,
    rigly: rigly.data,
    message: [
      emailSent ? 'Order marked as shipped and customer notified.' : 'Order marked as shipped, but the email to the customer could not be sent.',
      rigly.synced ? '' : 'Rigly could not be updated; mark it shipped there too.',
    ].filter(Boolean).join(' '),
  };
}

export async function cancelOrder(
  supabase: any,
  orderId: string,
  details: { reason?: string | null; refundProof?: File | null }
): Promise<Outcome> {
  const { data: order } = await supabase.from('merch_orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return { ok: false, status: 404, error: 'Order not found.' };
  if (order.status === 'cancelled') return { ok: false, status: 400, error: 'Order is already cancelled.' };

  let proofPath: string | null = null;
  let refundProofUrl: string | null = null;
  if (details.refundProof) {
    const proofError = validateProofImage(details.refundProof);
    if (proofError) return { ok: false, status: 400, error: proofError };
    proofPath = `merch-refund-proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${getProofExtension(details.refundProof)}`;
    const upload = await supabase.storage.from('photos').upload(proofPath, details.refundProof, {
      upsert: false,
      contentType: details.refundProof.type,
      cacheControl: '3600',
    });
    if (upload.error) return { ok: false, status: 500, error: `Refund proof upload failed: ${upload.error.message}` };
    refundProofUrl = supabase.storage.from('photos').getPublicUrl(proofPath).data.publicUrl;
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('merch_orders')
    .update({
      status: 'cancelled',
      cancellation_reason: details.reason || null,
      refund_proof_url: refundProofUrl,
      refund_proof_path: proofPath,
      cancelled_at: now,
      updated_at: now,
    })
    .eq('id', orderId)
    .neq('status', 'cancelled')
    .select('id');
  if (updateError || !updated?.length) {
    // Don't leave an orphaned proof behind when the order wasn't cancelled
    if (proofPath) await supabase.storage.from('photos').remove([proofPath]);
    return {
      ok: false,
      status: updateError ? 500 : 400,
      error: updateError ? `Order update failed: ${updateError.message}` : 'Order is already cancelled.',
    };
  }

  // Only paid orders get a cancellation email (an unpaid checkout was never an order for the customer)
  const wasPaid = ['confirmed', 'shipped'].includes(order.status);
  const emailSent = wasPaid
    ? await sendEmail({ to: order.email, ...orderCancelledEmail(order, details.reason || null, refundProofUrl) })
    : false;
  const rigly = await tellRigly(supabase, order, 'cancelled', { reason: details.reason });

  return {
    ok: true,
    emailSent,
    riglySynced: rigly.synced,
    rigly: rigly.data,
    refundProofUrl,
    message: [
      !wasPaid ? 'Order cancelled.' : emailSent ? 'Order cancelled and customer notified.' : 'Order cancelled, but the email to the customer could not be sent.',
      rigly.synced ? '' : 'Rigly could not be updated; its stock still counts this order.',
    ].filter(Boolean).join(' '),
  };
}
