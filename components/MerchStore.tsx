'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';

interface SizeStock {
  [size: string]: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  image_urls?: string[] | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
  size_stock?: SizeStock | null;
}

interface MerchCheckoutConfig {
  qr_code_url?: string;
  disclaimer?: string;
}

interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CheckoutFormData {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

const DEFAULT_DISCLAIMER = 'Disclaimer: All merchandise orders are shipped via India Post.';

export default function MerchStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutConfig, setCheckoutConfig] = useState<MerchCheckoutConfig>({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [addedMessage, setAddedMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Fetch products + checkout config; subscribe to realtime changes so stock updates appear instantly
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const { data: productsData } = await supabase
        .from('merchandise')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      setProducts(productsData || []);

      const { data: checkoutData } = await supabase
        .from('general_config')
        .select('content')
        .eq('section_name', 'merch_checkout')
        .eq('is_active', true)
        .single();

      if (checkoutData?.content) {
        setCheckoutConfig(checkoutData.content as MerchCheckoutConfig);
      }

      setLoading(false);
    };

    fetchData();

    // Realtime subscription: any change to merchandise table updates the UI instantly
    const channel = supabase
      .channel('merchandise-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'merchandise' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Also refetch when the tab regains focus (catches updates made while tab was in background)
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (product: Product, size: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + 1 };
        return next;
      }

      return [...prev, { product, size, quantity: 1 }];
    });
    setAddedMessage(size === 'One Size' ? `${product.name} added to cart!` : `${product.name} (${size}) added to cart!`);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setAddedMessage(''), 400);
    }, 2500);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const next = [...prev];
      const updated = next[index].quantity + delta;
      if (updated <= 0) {
        next.splice(index, 1);
        return next;
      }
      next[index] = { ...next[index], quantity: updated };
      return next;
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutMessage('');

    if (cart.length === 0) {
      alert('Please add at least one item to cart.');
      return;
    }
    if (!paymentProof) {
      alert('Please upload payment proof screenshot before checkout.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('fullName', formData.fullName);
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      payload.append('addressLine1', formData.addressLine1);
      payload.append('addressLine2', formData.addressLine2);
      payload.append('city', formData.city);
      payload.append('state', formData.state);
      payload.append('pincode', formData.pincode);
      payload.append('totalAmount', String(totalAmount));
      payload.append('items', JSON.stringify(cart));
      payload.append('paymentProof', paymentProof);

      const response = await fetch('/api/merch-order', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      setCheckoutMessage('Order confirmed! A confirmation email has been sent.');
      setCart([]);
      setPaymentProof(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
      });
    } catch (error: any) {
      setCheckoutMessage(error?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast notification */}
      {addedMessage && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
            toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex items-center gap-3 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl shadow-green-900/40">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-sm sm:text-base">{addedMessage}</span>
          </div>
        </div>
      )}

      <section className="py-10 sm:py-12 bg-black">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="heading-lg text-white">Featured Products</h2>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              Go to Cart ({totalItems})
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">
                Merchandise coming soon. Check back later!
              </p>
            </div>
          )}
        </div>
      </section>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto bg-gray-950 border border-gray-700 rounded-xl">
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-gold">Cart & Checkout</h3>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h4 className="text-2xl font-bold text-gold mb-4">Your Cart</h4>
                {cart.length === 0 ? (
                  <p className="text-gray-400">No items added yet.</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={`${item.product.id}-${item.size}`} className="border border-gray-700 rounded-lg p-4">
                        <p className="text-white font-semibold">{item.product.name}</p>
                        {item.size !== 'One Size' && <p className="text-gray-300 text-sm">Size: {item.size}</p>}
                        <p className="text-gray-300 text-sm">Price: Rs. {item.product.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button type="button" onClick={() => updateQuantity(index, -1)} className="px-3 py-1 bg-gray-700 text-white rounded">-</button>
                          <span className="text-white">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(index, 1)} className="px-3 py-1 bg-gray-700 text-white rounded">+</button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-xl font-bold text-gold">Total: Rs. {totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h4 className="text-2xl font-bold text-gold mb-4">Checkout Details</h4>
                <form onSubmit={handleCheckout} className="space-y-3">
                  <input name="fullName" value={formData.fullName} onChange={handleFormChange} required placeholder="Full Name" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                  <input name="phone" value={formData.phone} onChange={handleFormChange} required placeholder="Phone Number" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                  <input name="email" value={formData.email} onChange={handleFormChange} required placeholder="Email" type="email" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                  <textarea name="addressLine1" value={formData.addressLine1} onChange={handleFormChange} required placeholder="Address Line 1" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                  <input name="addressLine2" value={formData.addressLine2} onChange={handleFormChange} placeholder="Address Line 2 (optional)" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input name="city" value={formData.city} onChange={handleFormChange} required placeholder="City" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                    <input name="state" value={formData.state} onChange={handleFormChange} required placeholder="State" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                    <input name="pincode" value={formData.pincode} onChange={handleFormChange} required placeholder="Pincode" className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded" />
                  </div>

                  <p className="text-yellow-300 text-sm mt-2">
                    {checkoutConfig.disclaimer || DEFAULT_DISCLAIMER}
                  </p>

                  {checkoutConfig.qr_code_url && (
                    <div className="bg-black border-2 border-gold rounded-lg p-4">
                      <p className="text-gold font-bold text-lg mb-1">Scan & Pay</p>
                      <p className="text-gray-300 text-sm mb-3">
                        Complete payment first, then upload payment proof below.
                      </p>
                      <div className="flex justify-center">
                        <img
                          src={checkoutConfig.qr_code_url}
                          alt="Payment QR code"
                          className="w-72 h-72 sm:w-80 sm:h-80 object-contain bg-white rounded-lg p-3 shadow-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-white font-semibold mb-1">Upload Payment Proof</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                      required
                      className="block w-full text-sm text-gray-300"
                    />
                  </div>

                  {checkoutMessage && <p className="text-sm text-gold">{checkoutMessage}</p>}

                  <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                    {submitting ? 'Placing Order...' : 'Confirm Checkout'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
