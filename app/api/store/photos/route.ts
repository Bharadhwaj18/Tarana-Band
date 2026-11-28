import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isRiglyRequest } from '@/lib/rigly';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The photos this site shows for a product, for Rigly's "pick a website photo" on a merch item.
// Rigly calls it with ?item=<Rigly item id>; the website product linked to that item answers with its photos
// in the order shown in the shop. Works for products that are switched off too, since Rigly's item may still need a picture.
export async function GET(request: NextRequest) {
  if (!isRiglyRequest(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const itemId = request.nextUrl.searchParams.get('item') || '';
  if (!UUID.test(itemId)) return NextResponse.json({ error: 'Unknown item.' }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'The website database is not configured.' }, { status: 500 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: product, error } = await supabase
    .from('merchandise')
    .select('name, image_url, image_urls')
    .eq('rigly_item_id', itemId)
    .order('order_position', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load the website photos.' }, { status: 500 });
  if (!product) return NextResponse.json({ linked: false, photos: [] }, { headers: { 'Cache-Control': 'no-store' } });

  const listed: unknown[] = Array.isArray(product.image_urls) && product.image_urls.length ? product.image_urls : [product.image_url];
  const photos = listed.filter((url): url is string => typeof url === 'string' && /^https:\/\//i.test(url));

  return NextResponse.json({ linked: true, name: product.name, photos }, { headers: { 'Cache-Control': 'no-store' } });
}
