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
}

export default function AdminMerchOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<MerchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundProof, setRefundProof] = useState<File | null>(null);
  const [actionMessage, setActionMessage] = useState('');

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

      if (!error) {
        setOrders((data || []) as MerchOrder[]);
      }
      setLoading(false);
    };
    run();
  }, [router]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gold">Merch Orders</h1>
        {actionMessage && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gold">
            {actionMessage}
          </div>
        )}
        {loading ? (
          <div className="text-gray-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-400">No orders yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => (
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
                  <p className="text-gold font-bold">Rs. {Number(order.total_amount || 0).toFixed(2)}</p>
                </div>
                <div className="mt-3">
                  <p className="text-gray-300 font-semibold text-sm mb-1">Items</p>
                  <ul className="text-gray-400 text-sm list-disc pl-5">
                    {(order.items || []).map((item, idx) => (
                      <li key={idx}>
                        {item.product?.name || 'Item'} | Size: {item.size} | Qty: {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Status: {order.status}</span>
                  {order.payment_proof_url && (
                    <a
                      href={order.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold-light text-sm underline"
                    >
                      View Payment Proof
                    </a>
                  )}
                  {order.refund_proof_url && (
                    <a
                      href={order.refund_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-sm underline"
                    >
                      View Refund Proof
                    </a>
                  )}
                </div>

                {order.status !== 'cancelled' ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCancelOrderId(order.id);
                        setCancelReason('');
                        setRefundProof(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                    >
                      Cancel Order
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-red-300">
                    Cancelled {order.cancellation_reason ? `- Reason: ${order.cancellation_reason}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gold">Cancel Order</h2>
            <p className="text-gray-300 text-sm">
              Add cancellation reason and upload refund proof. Customer will receive cancellation email.
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
                    if (!res.ok) {
                      throw new Error(data.error || 'Failed to cancel order.');
                    }

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
                  } catch (error: any) {
                    setActionMessage(error?.message || 'Failed to cancel order.');
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
