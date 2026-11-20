'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { getTourToday } from '@/lib/tours';

interface RecentOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{ product?: { name?: string }; size: string; quantity: number }>;
}

interface StockAlert {
  product: string;
  size: string;
  left: number;
}

interface NextShow {
  date: string;
  venue_name: string;
  city: string;
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'To ship', className: 'bg-poster text-white' },
  shipped: { label: 'Shipped', className: 'bg-ink text-paper' },
  cancelled: { label: 'Cancelled', className: 'border border-ink' },
  pending_payment: { label: 'Unpaid', className: 'border border-muted text-muted' },
  payment_failed: { label: 'Unpaid · expired', className: 'border border-muted text-muted' },
};

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

function shortName(name?: string) {
  return (name || 'Item').replace(/\s*Oversized T[- ]?Shirt/i, '').trim();
}

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [toShip, setToShip] = useState<number | null>(null);
  const [unpaid, setUnpaid] = useState<number | null>(null);
  const [messages, setMessages] = useState<number | null>(null);
  const [nextShow, setNextShow] = useState<NextShow | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/admin/login');
        return;
      }
      setReady(true);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [shipRes, unpaidRes, msgRes, showRes, recentRes, merchRes] = await Promise.all([
        supabase.from('merch_orders').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
        supabase.from('merch_orders').select('id', { count: 'exact', head: true }).eq('status', 'pending_payment'),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('submitted_at', weekAgo),
        supabase
          .from('tours')
          .select('date, venue_name, city')
          .neq('status', 'cancelled')
          .gte('date', getTourToday())
          .order('date', { ascending: true })
          .limit(1),
        supabase
          .from('merch_orders')
          .select('id, status, total_amount, created_at, items')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('merchandise').select('name, size_stock').eq('is_active', true),
      ]);

      setToShip(shipRes.count ?? 0);
      setUnpaid(unpaidRes.count ?? 0);
      setMessages(msgRes.count ?? 0);
      setNextShow(showRes.data?.[0] || null);
      setRecent((recentRes.data as RecentOrder[]) || []);

      const lowStock: StockAlert[] = [];
      (merchRes.data || []).forEach((product: { name: string; size_stock: Record<string, number> | null }) => {
        if (!product.size_stock || Object.keys(product.size_stock).length === 0) return;
        SIZES.forEach((size) => {
          const left = product.size_stock?.[size] ?? 0;
          if (left <= 3) lowStock.push({ product: shortName(product.name), size, left });
        });
      });
      setAlerts(lowStock.sort((a, b) => b.left - a.left));
    };

    load();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="gp-mono text-paper">Loading backstage…</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const fmt = (n: number | null) => (n === null ? '–' : String(n));

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <p className="gp-mono text-[13px] uppercase mb-2">{today}</p>
          <h1>
            Backstage<span className="text-poster">.</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/admin/tours" className="gp-btn gp-btn-ink min-h-[48px] px-4">
            + Add a show
          </Link>
          <Link href="/admin/gallery" className="gp-btn gp-btn-outline min-h-[48px] px-4">
            + Upload photos
          </Link>
          <Link href="/admin/videos" className="gp-btn gp-btn-outline min-h-[48px] px-4">
            + Add a video
          </Link>
        </div>
      </div>

      <section aria-label="Needs attention" className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4 mb-10">
        <Link
          href="/admin/merch-orders"
          className={`block p-6 border-[3px] border-ink ${toShip ? 'bg-poster text-white shadow-hard-sm' : 'bg-white'}`}
        >
          <div className="gp-mono text-xs uppercase">Paid, ready to ship</div>
          <div className="font-poster text-6xl leading-none mt-2.5">{fmt(toShip)}</div>
          <div className="mt-2 font-bold">{toShip ? 'Pack & ship →' : 'All caught up'}</div>
        </Link>
        <Link href="/admin/merch-orders" className="block p-6 border-[3px] border-ink bg-white">
          <div className="gp-mono text-xs uppercase">Unpaid checkouts</div>
          <div className="font-poster text-6xl leading-none mt-2.5">{fmt(unpaid)}</div>
          <div className="mt-2 text-sm">Started, never paid. No action needed.</div>
        </Link>
        <Link href="/admin/contact-submissions" className="block p-6 border-[3px] border-ink bg-white">
          <div className="gp-mono text-xs uppercase">Messages this week</div>
          <div className="font-poster text-6xl leading-none mt-2.5">{fmt(messages)}</div>
          <div className="mt-2 font-bold">Read inbox →</div>
        </Link>
        <Link href="/admin/tours" className="block p-6 border-[3px] border-ink bg-ink text-paper">
          <div className="gp-mono text-xs uppercase text-poster-light">Next show</div>
          {nextShow ? (
            <>
              <div className="font-poster uppercase text-2xl leading-tight mt-3">{nextShow.venue_name}</div>
              <div className="gp-mono text-sm mt-2">
                {new Date(nextShow.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {nextShow.city}
              </div>
            </>
          ) : (
            <>
              <div className="font-poster uppercase text-[28px] leading-tight mt-3">None booked</div>
              <div className="mt-2 font-bold">Add one →</div>
            </>
          )}
        </Link>
      </section>

      <div className="flex flex-wrap gap-8 items-start">
        <section className="flex-[999_1_480px] min-w-0 bg-white border-[3px] border-ink">
          <div className="flex justify-between items-center px-5 py-4 border-b-[3px] border-ink">
            <h2 className="text-2xl">Recent orders</h2>
            <Link href="/admin/merch-orders" className="gp-mono text-[13px] font-bold underline underline-offset-4">
              All orders →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="p-5">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] min-w-[460px]">
                <thead>
                  <tr className="text-left">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => {
                    const style = STATUS_STYLE[order.status] || { label: order.status, className: 'border border-ink' };
                    const muted = order.status === 'pending_payment' || order.status === 'payment_failed';
                    return (
                      <tr key={order.id} className={`border-b border-rule last:border-0 ${muted ? 'text-muted' : ''}`}>
                        <td className="px-5 py-3.5 gp-mono">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-5 py-3.5">
                          {(order.items || [])
                            .map((item) => `${shortName(item.product?.name)}${item.size && item.size !== 'One Size' ? ` · ${item.size}` : ''}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`)
                            .join(', ')}
                        </td>
                        <td className="px-5 py-3.5">₹{Number(order.total_amount).toFixed(0)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`gp-mono text-xs font-bold uppercase px-2 py-1 ${style.className}`}>{style.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex-[1_1_280px] min-w-0 bg-white border-[3px] border-ink">
          <div className="flex justify-between items-center px-5 py-4 border-b-[3px] border-ink">
            <h2 className="text-2xl">Stock alerts</h2>
            <Link href="/admin/inventory" className="gp-mono text-[13px] font-bold underline underline-offset-4">
              Restock →
            </Link>
          </div>
          {alerts.length === 0 ? (
            <p className="p-5">Every size has more than 3 left.</p>
          ) : (
            <ul className="px-5 py-2">
              {alerts.map((alert) => (
                <li
                  key={`${alert.product}-${alert.size}`}
                  className="flex justify-between gap-3 py-3 border-b border-rule last:border-0"
                >
                  <span>
                    {alert.product} · {alert.size}
                  </span>
                  <span className={`gp-mono font-bold ${alert.left > 0 ? 'text-poster-dark' : ''}`}>
                    {alert.left > 0 ? `${alert.left} left` : 'Sold out'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
