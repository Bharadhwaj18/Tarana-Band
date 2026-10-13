interface OrderItem {
  product?: { id?: string };
  size: string;
  quantity: number;
}

// Adds (direction = 1) or removes (direction = -1) the ordered quantities from
// merchandise.size_stock. Products without size_stock are not stock-tracked.
export async function adjustStock(supabase: any, items: OrderItem[], direction: 1 | -1) {
  for (const item of items || []) {
    const productId = item.product?.id;
    const size = item.size;
    const qty = item.quantity || 1;
    if (!productId || !size) continue;

    const { data: product } = await supabase
      .from('merchandise')
      .select('size_stock')
      .eq('id', productId)
      .single();

    if (product?.size_stock && product.size_stock[size] !== undefined) {
      const newQty = Math.max(0, product.size_stock[size] + direction * qty);
      await supabase
        .from('merchandise')
        .update({
          size_stock: { ...product.size_stock, [size]: newQty },
        })
        .eq('id', productId);
    }
  }
}
