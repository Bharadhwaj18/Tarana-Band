import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCatalog } from '@/lib/merchCatalog';
import { getNavigationFlags, isPageEnabled } from '@/lib/pageVisibility';

export const dynamic = 'force-dynamic';

// The shop's products with live sizes and stock from Rigly (or the last saved stock if Rigly can't be reached).
// When the shop is open to everyone, the answer is shared and kept for 30 seconds, so most visitors get it instantly
// instead of waiting on the database and Rigly. Checkout always re-checks stock live, so a slightly old number
// on screen can never oversell.
export async function GET() {
  // Open to everyone (as opposed to open only to someone holding the private reviewer link)
  const openToEveryone = (await getNavigationFlags())?.show_merch !== false;
  if (!openToEveryone && !(await isPageEnabled('show_merch'))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    const { products, live } = await getCatalog(supabase);
    return NextResponse.json(
      { products, live },
      {
        headers: {
          // A reviewer looking at a switched-off shop must never fill the shared cache
          'Cache-Control': openToEveryone ? 'public, s-maxage=30, stale-while-revalidate=60' : 'private, no-store',
        },
      }
    );
  } catch (error) {
    console.error('Merch products error:', error);
    return NextResponse.json({ error: 'Could not load the shop.' }, { status: 500 });
  }
}
