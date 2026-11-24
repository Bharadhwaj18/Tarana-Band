import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCatalog } from '@/lib/merchCatalog';
import { isPageEnabled } from '@/lib/pageVisibility';

export const dynamic = 'force-dynamic';

// The shop's products with live sizes and stock from Rigly (or the last saved stock if Rigly can't be reached).
export async function GET() {
  if (!(await isPageEnabled('show_merch'))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { products, live } = await getCatalog(supabase);
    return NextResponse.json({ products, live }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Merch products error:', error);
    return NextResponse.json({ error: 'Could not load the shop.' }, { status: 500 });
  }
}
