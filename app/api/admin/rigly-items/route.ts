import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getRiglyStock, isRiglyConfigured } from '@/lib/rigly';

export const dynamic = 'force-dynamic';

// Rigly's live items, sizes and stock, for linking shop products and for the inventory pages.
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  if (!isRiglyConfigured()) {
    return NextResponse.json({ error: 'Rigly is not linked yet (RIGLY_URL / STORE_API_KEY missing).' }, { status: 503 });
  }
  try {
    return NextResponse.json({ items: await getRiglyStock() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    return NextResponse.json({ error: `Couldn't reach Rigly: ${error?.message || error}` }, { status: 502 });
  }
}
