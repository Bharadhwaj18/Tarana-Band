import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAuth';
import { cancelOrder } from '@/lib/merchFulfilment';

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const orderId = String(formData.get('orderId') || '');
    const reason = String(formData.get('reason') || '');
    const refundProof = formData.get('refundProof') as File | null;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }
    if (!refundProof) {
      return NextResponse.json({ error: 'Refund proof is required.' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase server config is missing.' }, { status: 500 });
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Updates the order, emails the customer and puts the stock back in Rigly
    const result = await cancelOrder(supabase, orderId, { reason: reason || null, refundProof });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      riglySynced: result.riglySynced,
      message: result.message,
      refundProofUrl: result.refundProofUrl,
    });
  } catch (error) {
    console.error('Cancel merch order error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
