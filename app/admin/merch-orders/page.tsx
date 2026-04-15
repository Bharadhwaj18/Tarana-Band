'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';

interface MerchOrder {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  items: Array<{ product?: { name?: string }; size: string; quantity: number }>;
  total_amount: number;
  payment_proof_url: string;
  refund_proof_url?: string | null;
  cancellation_reason?: string | null;
  status: string;
  created_at: string;
  shipped_at?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
}

type Tab = 'confirmed' | 'shipped' | 'cancelled' | 'all';

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-yellow-900/50 text-yellow-300',
  shipped:   'bg-blue-900/50 text-blue-300',
  cancelled: 'bg-red-900/50 text-red-400',
};

export default function AdminMerchOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('confirmed');
  const [actionMessage, setActionMessage] = useState('');

  // Cancel modal state
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundProof, setRefundProof] = useState<File | null>(null);

  // Ship modal state
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [shipping, setShipping] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/admin/login');
        return;
      }

      const { data, error } = await supabase
        .from('merch_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setOrders((data || []) as MerchOrder[]);
      setLoading(false);
    };
    run();
  }, [router]);

  const filteredOrders =
    activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const tabCount = (tab: Tab) =>
    tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped',   label: 'Shipped'   },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'all',       label: 'All'       },
  ];

  const handleShip = async () => {
    if (!shipOrderId) return;
    setShipping(true);
    setActionMessage('');
    try {
      const res = await fetch('/api/admin/merch-order/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: shipOrderId, trackingNumber, carrier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as shipped.');

      setOrders((prev) =>
        prev.map((o) =>
          o.id === shipOrderId
            ? {
                ...o,
                status: 'shipped',
                tracking_number: trackingNumber || null,
                carrier: carrier || null,
                shipped_at: new Date().toISOString(),
              }
            : o
        )
      );
      setActionMessage('Order marked as shipped and customer notified.');
      setShipOrderId(null);
    } catch (err: any) {
      setActionMessage(err?.message || 'Failed to mark as shipped.');
    } finally {
      setShipping(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gold">Merch Orders</h1>

        {actionMessage && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gold">
            {actionMessage}
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-gray-700">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs bg-gray-700 px-1.5 py-0.5 rounded-full">
                {tabCount(key)}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-gray-400 py-8 text-center">No {activeTab === 'all' ? '' : activeTab} orders.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <p className="text-white font-semibold">{order.customer_name}</p>
                    <p className="text-gray-300 text-sm">{order.phone} | {order.email}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {order.address_line1}
                      {order.address_line2 ? `, ${order.address_line2}` : ''}
                      {`, ${order.city}, ${order.state} - ${order.pincode}`}
                    </p>
                  </div>
                  <p className="text-gold font-bold shrink-0">Rs. {Number(order.total_amount || 0).toFixed(2)}</p>
                </div>

                {/* Items */}
                <div className="mt-3">
                  <p className="text-gray-300 font-semibold text-sm mb-1">Items</p>
                  <ul className="text-gray-400 text-sm list-disc pl-5">
                    {(order.items || []).map((item, idx) => (
                      <li key={idx}>
                        {item.product?.name || 'Item'} — Size: {item.size} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status row */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${STATUS_BADGE[order.status] || 'bg-gray-700 text-gray-300'}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {order.payment_proof_url && (
                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-gold hover:text-gold-light text-sm underline">
                      Payment Proof
                    </a>
                  )}
                  {order.refund_proof_url && (
                    <a href={order.refund_proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-sm underline">
                      Refund Proof
                    </a>
                  )}
                </div>

                {/* Shipped info */}
                {order.status === 'shipped' && (order.tracking_number || order.carrier) && (
                  <div className="mt-2 text-sm text-blue-300">
                    {order.carrier && <span>{order.carrier}</span>}
                    {order.carrier && order.tracking_number && <span className="mx-1">·</span>}
                    {order.tracking_number && <span>Tracking: <strong>{order.tracking_number}</strong></span>}
                  </div>
                )}

                {/* Cancelled info */}
                {order.status === 'cancelled' && order.cancellation_reason && (
                  <div className="mt-2 text-sm text-red-300">
                    Reason: {order.cancellation_reason}
                  </div>
                )}

                {/* Action buttons */}
                {order.status === 'confirmed' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setShipOrderId(order.id); setTrackingNumber(''); setCarrier(''); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                    >
                      Mark as Shipped
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCancelOrderId(order.id); setCancelReason(''); setRefundProof(null); }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
                {order.status === 'shipped' && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => { setCancelOrderId(order.id); setCancelReason(''); setRefundProof(null); }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ship modal */}
      {shipOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gold">Mark as Shipped</h2>
            <p className="text-gray-300 text-sm">
              Optionally add tracking details. The customer will receive a shipping confirmation email.
            </p>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Carrier (e.g. India Post, Delhivery)"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking number (optional)"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleShip}
                disabled={shipping}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-semibold"
              >
                {shipping ? 'Shipping...' : 'Confirm Shipment'}
              </button>
              <button
                type="button"
                onClick={() => setShipOrderId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gold">Cancel Order</h2>
            <p className="text-gray-300 text-sm">
              Add a cancellation reason and upload refund proof. The customer will receive a cancellation email.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            />
            <div>
              <label className="block text-sm text-gray-300 mb-1">Refund Proof Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRefundProof(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!refundProof) {
                    setActionMessage('Refund proof is required.');
                    return;
                  }
                  try {
                    setActionMessage('Cancelling order...');
                    const payload = new FormData();
                    payload.append('orderId', cancelOrderId);
                    payload.append('reason', cancelReason);
                    payload.append('refundProof', refundProof);

                    const res = await fetch('/api/admin/merch-order/cancel', {
                      method: 'POST',
                      body: payload,
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to cancel order.');

                    setOrders((prev) =>
                      prev.map((o) =>
                        o.id === cancelOrderId
                          ? {
                              ...o,
                              status: 'cancelled',
                              cancellation_reason: cancelReason || null,
                              refund_proof_url: data.refundProofUrl || o.refund_proof_url || null,
                            }
                          : o
                      )
                    );
                    setActionMessage('Order cancelled and email sent.');
                    setCancelOrderId(null);
                  } catch (err: any) {
                    setActionMessage(err?.message || 'Failed to cancel order.');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
              >
                Confirm Cancel
              </button>
              <button
                type="button"
                onClick={() => setCancelOrderId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
