'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { useRiglyItems } from '@/lib/useRiglyItems';

interface ShopProduct {
  id: string;
  name: string;
  is_active: boolean;
  rigly_item_id: string | null;
}

function stockClass(qty: number): string {
  if (qty <= 0) return 'bg-red-900/50 text-red-400';
  if (qty <= 5) return 'bg-yellow-900/50 text-yellow-300';
  return 'bg-green-900/50 text-green-400';
}

// Stock lives in Rigly now: this page shows it, and what the shop can sell (stock minus units out in show kits).
// Restocks, counts and fixes are done in Rigly → Merch.
export default function AdminInventoryPage() {
  const router = useRouter();
  const rigly = useRiglyItems();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [toShip, setToShip] = useState(0);

  useEffect(() => {
    const run = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/admin/login');
        return;
      }
      const [{ data: rows }, { count }] = await Promise.all([
        supabase.from('merchandise').select('id, name, is_active, rigly_item_id').order('order_position'),
        supabase.from('merch_orders').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      ]);
      setProducts((rows || []) as ShopProduct[]);
      setToShip(count ?? 0);
    };
    run();
  }, [router]);

  const listingFor = (itemId: string) => products.find((p) => p.rigly_item_id === itemId);
  const lowCount = rigly.items.reduce((n, item) => n + item.variants.filter((v) => v.available <= 5).length, 0);
  const onSale = rigly.items.filter((item) => listingFor(item.id)?.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gold">Inventory</h1>
          <p className="text-sm text-gray-400 mt-1">
            Stock is kept in Rigly. Restock, count and fix stock there (Rigly → Merch); this page updates by itself.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
            <p className="text-3xl font-bold text-white">{onSale}</p>
            <p className="text-sm text-gray-400 mt-1">Items on sale in the shop</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
            <p className={`text-3xl font-bold ${lowCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{lowCount}</p>
            <p className="text-sm text-gray-400 mt-1">Low / sold-out sizes online</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
            <p className={`text-3xl font-bold ${toShip > 0 ? 'text-gold' : 'text-white'}`}>{toShip}</p>
            <p className="text-sm text-gray-400 mt-1">Orders to ship</p>
          </div>
        </div>

        {rigly.error ? (
          <div className="p-3 rounded-lg border text-sm bg-red-900/30 border-red-700 text-red-300">{rigly.error}</div>
        ) : rigly.loading ? (
          <p className="text-gray-400">Loading stock from Rigly…</p>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-gray-700 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gold">Stock from Rigly</h2>
                <p className="text-xs text-gray-400 mt-1">Per size: what can be sold online, then (in brackets) the total and any units out in show kits.</p>
              </div>
              <button type="button" onClick={rigly.reload} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded">
                Refresh
              </button>
            </div>
            <ul className="divide-y divide-gray-700/50">
              {rigly.items.map((item) => {
                const listing = listingFor(item.id);
                return (
                  <li key={item.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-white font-medium">{item.name}</p>
                      <span className={`text-xs ${listing?.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                        {listing ? (listing.is_active ? 'on sale online' : 'listed, switched off') : 'show-only (not listed in the shop)'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.variants.map((v) => (
                        <span key={v.id} className={`text-xs font-semibold px-2 py-1 rounded ${stockClass(v.available)}`}>
                          {v.label}: {v.available}
                          <span className="font-normal opacity-80"> ({v.stock}{v.inKits ? `, ${v.inKits} in kits` : ''})</span>
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            {rigly.items.length === 0 && <p className="p-5 text-gray-400 text-sm">No items in Rigly yet.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
