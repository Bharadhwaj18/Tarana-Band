'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';

interface InventoryProduct {
  id: string;
  name: string;
  is_active: boolean;
  size_stock: Record<string, number> | null;
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

function stockClass(qty: number | undefined): string {
  if (qty === undefined) return '';
  if (qty <= 0) return 'bg-red-900/50 text-red-400';
  if (qty <= 5) return 'bg-yellow-900/50 text-yellow-300';
  return 'bg-green-900/50 text-green-400';
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  // { [productId]: { [size]: newQty } }
  const [edits, setEdits] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/admin/login');
        return;
      }

      const [{ data: products }, { data: pending }] = await Promise.all([
        supabase
          .from('merchandise')
          .select('id, name, is_active, size_stock')
          .order('order_position'),
        supabase
          .from('merch_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed'),
      ]);

      setProducts((products || []) as InventoryProduct[]);
      setPendingCount((pending as any)?.length ?? 0);
      setLoading(false);
    };
    run();
  }, [router]);

  // Re-fetch pending count from count field since head:true returns null data
  useEffect(() => {
    const run = async () => {
      if (!supabase) return;
      const { count } = await supabase
        .from('merch_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');
      setPendingCount(count ?? 0);
    };
    run();
  }, []);

  const sizedProducts = products.filter(
    (p) => p.size_stock && Object.keys(p.size_stock).length > 0
  );
  const unsizedProducts = products.filter(
    (p) => !p.size_stock || Object.keys(p.size_stock).length === 0
  );

  const activeCount = products.filter((p) => p.is_active).length;

  const lowStockCount = sizedProducts.reduce((acc, p) => {
    const stock = p.size_stock || {};
    return acc + SIZES.filter((s) => s in stock && stock[s] <= 5).length;
  }, 0);

  const handleEdit = (productId: string, size: string, value: string) => {
    const num = parseInt(value, 10);
    setEdits((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [size]: isNaN(num) ? 0 : Math.max(0, num),
      },
    }));
  };

  const handleSave = async (product: InventoryProduct) => {
    if (!supabase) return;
    const productEdits = edits[product.id];
    if (!productEdits || Object.keys(productEdits).length === 0) return;

    setSaving(product.id);
    setMessage('');
    try {
      const merged = { ...(product.size_stock || {}), ...productEdits };
      const { error } = await supabase
        .from('merchandise')
        .update({ size_stock: merged })
        .eq('id', product.id);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, size_stock: merged } : p
        )
      );
      setEdits((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      setMessage(`Stock updated for "${product.name}".`);
    } catch (err: any) {
      setMessage(`Error: ${err?.message || 'Failed to save.'}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading inventory...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gold">Inventory</h1>

        {message && (
          <div className={`p-3 rounded-lg border text-sm ${
            message.startsWith('Error')
              ? 'bg-red-900/30 border-red-700 text-red-300'
              : 'bg-green-900/30 border-green-700 text-green-300'
          }`}>
            {message}
          </div>
        )}

        {/* Summary bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
            <p className="text-3xl font-bold text-white">{activeCount}</p>
            <p className="text-sm text-gray-400 mt-1">Active Products</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
            <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {lowStockCount}
            </p>
            <p className="text-sm text-gray-400 mt-1">Low / Out-of-Stock Sizes</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
            <p className={`text-3xl font-bold ${pendingCount > 0 ? 'text-gold' : 'text-white'}`}>
              {pendingCount}
            </p>
            <p className="text-sm text-gray-400 mt-1">Pending Orders</p>
          </div>
        </div>

        {/* Sized products — stock table */}
        {sizedProducts.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-gold">Stock Levels</h2>
              <p className="text-xs text-gray-400 mt-1">
                Edit any cell and press Save to update. Changes are merged — untouched sizes stay as-is.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-semibold w-48">Product</th>
                    {SIZES.map((s) => (
                      <th key={s} className="text-center px-3 py-3 font-semibold w-24">{s}</th>
                    ))}
                    <th className="px-5 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {sizedProducts.map((product) => {
                    const stock = product.size_stock || {};
                    const productEdits = edits[product.id] || {};
                    const hasEdits = Object.keys(productEdits).length > 0;

                    return (
                      <tr key={product.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-white font-medium">{product.name}</p>
                          {!product.is_active && (
                            <span className="text-xs text-gray-500">(inactive)</span>
                          )}
                        </td>
                        {SIZES.map((size) => {
                          const hasSizeInStock = size in stock;
                          if (!hasSizeInStock) {
                            return (
                              <td key={size} className="px-3 py-4 text-center">
                                <span className="text-gray-600 text-lg">–</span>
                              </td>
                            );
                          }
                          const currentQty = size in productEdits ? productEdits[size] : stock[size];
                          return (
                            <td key={size} className="px-3 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${stockClass(stock[size])}`}>
                                  {stock[size]}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={currentQty}
                                  onChange={(e) => handleEdit(product.id, size, e.target.value)}
                                  className="w-16 text-center px-1 py-1 bg-gray-700 border border-gray-600 text-white rounded text-xs focus:border-gold focus:outline-none"
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSave(product)}
                            disabled={!hasEdits || saving === product.id}
                            className="px-3 py-1.5 bg-gold hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed text-black text-xs font-semibold rounded transition"
                          >
                            {saving === product.id ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unsized products */}
        {unsizedProducts.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <h2 className="text-xl font-semibold text-gold mb-3">Non-Clothing Products</h2>
            <p className="text-xs text-gray-400 mb-4">
              These products have no size stock configured. Manage them from the Merchandise page.
            </p>
            <div className="space-y-2">
              {unsizedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm">{product.name}</span>
                    {!product.is_active && (
                      <span className="text-xs text-gray-500">(inactive)</span>
                    )}
                  </div>
                  <a
                    href="/admin/merch"
                    className="text-gold hover:text-gold-light text-xs underline"
                  >
                    Edit in Merchandise →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length === 0 && (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-gray-400">No products yet.</p>
            <a href="/admin/merch" className="text-gold hover:text-gold-light underline text-sm mt-2 inline-block">
              Add products in Merchandise →
            </a>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
