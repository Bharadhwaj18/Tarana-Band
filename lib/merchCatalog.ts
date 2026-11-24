import { getRiglyStock, type RiglyItem } from '@/lib/rigly';

// The shop's products: the photos, words and online price live on this site (merchandise table); the sizes and how
// many can be sold come from Rigly. A product shows in the shop only once it's switched on and linked to a Rigly item.
// Every successful read from Rigly is saved into merchandise.size_stock, so the shop can still show the last known
// stock if Rigly is briefly unreachable (checkout always re-checks Rigly live and refuses if it can't).

export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  image_urls: string[] | null;
  image_positions: string[] | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
  rigly_item_id: string;
  /** Size label -> how many can be sold online, in Rigly's size order */
  size_stock: Record<string, number>;
  /** Size label -> Rigly variant id */
  variant_ids: Record<string, string>;
}

const PRODUCT_COLUMNS =
  'id, name, description, image_url, image_urls, image_positions, price, external_link, is_active, order_position, rigly_item_id, size_stock';

function sizesFrom(item: RiglyItem | undefined) {
  const size_stock: Record<string, number> = {};
  const variant_ids: Record<string, string> = {};
  for (const v of item?.variants || []) {
    size_stock[v.label] = Math.max(0, v.available);
    variant_ids[v.label] = v.id;
  }
  return { size_stock, variant_ids };
}

/**
 * Active, linked products with their sizes. `live` is false when Rigly couldn't be reached and the last saved stock
 * was used instead. With `requireLive`, a Rigly failure throws instead of falling back (for checkout).
 */
export async function getCatalog(
  supabase: any,
  options: { requireLive?: boolean; ids?: string[] } = {}
): Promise<{ products: CatalogProduct[]; live: boolean }> {
  let query = supabase
    .from('merchandise')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .not('rigly_item_id', 'is', null)
    .order('order_position', { ascending: true });
  if (options.ids) query = query.in('id', options.ids);
  const { data: rows, error } = await query;
  if (error) throw new Error(`Could not load products: ${error.message}`);

  let riglyItems: RiglyItem[] | null = null;
  try {
    riglyItems = await getRiglyStock();
  } catch (err) {
    if (options.requireLive) throw err;
    console.error('Rigly stock unavailable, using last saved stock:', err);
  }

  const products: CatalogProduct[] = [];
  for (const row of rows || []) {
    if (riglyItems) {
      const item = riglyItems.find((i) => i.id === row.rigly_item_id);
      // Archived or deleted in Rigly: not for sale
      if (!item) continue;
      const { size_stock, variant_ids } = sizesFrom(item);
      products.push({ ...row, size_stock, variant_ids });
      // Keep the fallback copy current
      if (JSON.stringify(row.size_stock || {}) !== JSON.stringify(size_stock)) {
        await supabase.from('merchandise').update({ size_stock }).eq('id', row.id);
      }
    } else {
      products.push({ ...row, size_stock: row.size_stock || {}, variant_ids: {} });
    }
  }
  return { products, live: !!riglyItems };
}
