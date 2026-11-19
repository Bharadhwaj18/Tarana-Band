'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ProductCard, { ONE_SIZE, stockFor, type Product } from './ProductCard';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Loads Razorpay's checkout script once, on first checkout
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    const script = (existing as HTMLScriptElement) || document.createElement('script');
    script.addEventListener('load', () => resolve(true));
    script.addEventListener('error', () => resolve(false));
    if (!existing) {
      script.src = RAZORPAY_SCRIPT_URL;
      document.body.appendChild(script);
    }
  });
}

interface MerchCheckoutConfig {
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

interface ConfirmedOrder {
  orderId: string;
  items: CartItem[];
  total: number;
  emailSent: boolean;
  email: string;
}

type FieldName = keyof CheckoutFormData;

const DEFAULT_DISCLAIMER = 'All merchandise orders are shipped via India Post.';

const EMPTY_FORM: CheckoutFormData = {
  fullName: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

const FIELD_LABELS: Record<FieldName, string> = {
  fullName: 'name',
  phone: 'phone',
  email: 'email',
  addressLine1: 'address',
  addressLine2: 'address line 2',
  city: 'city',
  state: 'state',
  pincode: 'pincode',
};

// Returns an error for each field that isn't ready, so the Pay button can say why it's disabled
function validate(form: CheckoutFormData): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (!form.fullName.trim()) errors.fullName = 'Enter your full name';
  const phoneDigits = form.phone.replace(/\D/g, '');
  if (!phoneDigits) errors.phone = 'Enter your phone number';
  else if (phoneDigits.length < 10) errors.phone = 'Enter a 10-digit mobile number';
  if (!form.email.trim()) errors.email = 'Enter your email for order updates';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Check your email address';
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Enter your address';
  if (!form.city.trim()) errors.city = 'Enter your city';
  if (!form.state.trim()) errors.state = 'Enter your state';
  if (!form.pincode.trim()) errors.pincode = 'Enter your pincode';
  else if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Pincode is 6 digits';
  return errors;
}

function listWords(words: string[]) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

export default function MerchStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutConfig, setCheckoutConfig] = useState<MerchCheckoutConfig>({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutInfo, setCheckoutInfo] = useState('');
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fetch products + checkout config; realtime keeps stock current
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
        .maybeSingle();

      if (checkoutData?.content) {
        setCheckoutConfig(checkoutData.content as MerchCheckoutConfig);
      }

      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('merchandise-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merchandise' }, () => fetchData())
      .subscribe();

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Bag panel: Escape closes it (unless a payment is in progress) and the page behind stops scrolling
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) setIsCartOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, submitting]);

  const totalAmount = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const errors = validate(formData);
  const errorFields = Object.keys(errors) as FieldName[];

  const showToast = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  // Latest stock for a bag item, so the + button stops at what's actually available
  const maxFor = (item: CartItem) => {
    const latest = products.find((p) => p.id === item.product.id) || item.product;
    return stockFor(latest, item.size);
  };

  const addToCart = (product: Product, size: string) => {
    setConfirmed(null);
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id && item.size === size);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + 1 };
        return next;
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    trackEvent('add_to_cart', {
      currency: 'INR',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, item_variant: size, price: product.price, quantity: 1 }],
    });
    showToast(size === ONE_SIZE ? `${product.name} added to your bag` : `${product.name} (${size}) added to your bag`);
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

  const removeItem = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const markTouched = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as FieldName;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const openBag = () => {
    setIsCartOpen(true);
    setCheckoutError('');
    setCheckoutInfo('');
    trackEvent('view_cart', { currency: 'INR', value: totalAmount, item_count: totalItems });
  };

  const bagCountFor = (productId: string) =>
    cart
      .filter((item) => item.product.id === productId)
      .reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.size]: item.quantity }), {});

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutInfo('');

    if (cart.length === 0) return;
    if (errorFields.length > 0) {
      setTouched(Object.fromEntries(errorFields.map((f) => [f, true])));
      return;
    }

    const analyticsItems = cart.map((i) => ({
      item_id: i.product.id,
      item_name: i.product.name,
      item_variant: i.size,
      price: i.product.price,
      quantity: i.quantity,
    }));
    const orderValue = totalAmount;
    const orderItems = cart;
    const customerEmail = formData.email.trim();

    trackEvent('begin_checkout', { currency: 'INR', value: orderValue, items: analyticsItems });

    setSubmitting(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Could not load the payment window. Please check your connection and try again.');
      }

      // Server checks prices and stock, saves the order and creates the Razorpay order
      const response = await fetch('/api/merch-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, totalAmount, items: cart }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout.');
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Tarana',
        description: 'Merchandise order',
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: '#D2281F' },
        handler: async (paymentResponse: any) => {
          setCheckoutInfo('Confirming your payment…');
          try {
            const verifyResponse = await fetch('/api/merch-order/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderId, ...paymentResponse }),
            });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'We could not confirm your payment.');
            }

            trackEvent('purchase', {
              transaction_id: data.orderId,
              currency: 'INR',
              value: orderValue,
              items: analyticsItems,
            });
            setConfirmed({
              orderId: data.orderId,
              items: orderItems,
              total: orderValue,
              emailSent: !!verifyData.emailSent,
              email: customerEmail,
            });
            setCheckoutInfo('');
            setCart([]);
            setFormData(EMPTY_FORM);
            setTouched({});
          } catch (error: any) {
            setCheckoutInfo('');
            setCheckoutError(
              `${error?.message || 'We could not confirm your payment.'} If money was deducted, please contact us with payment ID ${paymentResponse?.razorpay_payment_id}.`
            );
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setCheckoutError('Payment was not completed, so no money was taken and your order has not been placed. Your bag and details are saved.');
          },
        },
      });

      // The pop-up stays open after a failure so the customer can retry
      razorpay.on('payment.failed', (failure: any) => {
        setCheckoutError(
          failure?.error?.description
            ? `Payment failed: ${failure.error.description}`
            : 'Payment failed. Please try again.'
        );
      });

      razorpay.open();
    } catch (error: any) {
      setCheckoutError(error?.message || 'Failed to start checkout.');
      setSubmitting(false);
    }
  };

  const step = confirmed ? 4 : submitting ? 3 : cart.length > 0 ? 2 : 1;
  const missing = errorFields.map((f) => FIELD_LABELS[f]);
  const payDisabledReason =
    cart.length === 0
      ? 'Your bag is empty.'
      : missing.length > 0
        ? `Fill in your ${listWords(missing)} to pay.`
        : '';

  const field = (name: FieldName, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => {
    const showError = touched[name] && errors[name];
    return (
      <label className="gp-label">
        <span>
          {label} {optional && <span className="font-normal normal-case">(optional)</span>}
        </span>
        <input
          name={name}
          value={formData[name]}
          onChange={handleFormChange}
          onBlur={markTouched}
          required={!optional}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? `${name}-error` : undefined}
          className="gp-input"
          {...props}
        />
        {showError && (
          <span id={`${name}-error`} className="font-normal normal-case text-poster-dark">
            {errors[name]}
          </span>
        )}
      </label>
    );
  };

  return (
    <>
      {/* Added-to-bag toast */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {toast && (
          <div className="flex items-center gap-4 bg-ink text-paper border-[3px] border-ink shadow-[6px_6px_0_#D2281F] pl-5 pr-2 py-2 font-archivo">
            <span className="font-bold">✓ {toast}</span>
            <button type="button" onClick={openBag} className="gp-btn gp-btn-red min-h-[44px] px-4 text-sm">
              View bag
            </button>
          </div>
        )}
      </div>

      <section className="gp-container pb-20 sm:pb-24">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <p className="gp-mono text-sm uppercase">
            {loading ? 'Loading the drop…' : `${products.length} ${products.length === 1 ? 'item' : 'items'} in the drop`}
          </p>
          <button type="button" onClick={openBag} className="gp-btn gp-btn-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M5 7h14l-1 14H6z" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            Bag
            <span className="bg-poster text-white px-2 gp-mono">{totalItems}</span>
          </button>
        </div>

        {confirmed && !isCartOpen && (
          <div className="mb-10 border-[3px] border-ink bg-white p-6 flex flex-wrap justify-between items-center gap-4">
            <p className="font-bold">
              ✓ Order #{confirmed.orderId.slice(0, 8).toUpperCase()} is confirmed.{' '}
              {confirmed.emailSent ? `A confirmation is on its way to ${confirmed.email}.` : ''}
            </p>
            <button type="button" onClick={() => setIsCartOpen(true)} className="gp-btn gp-btn-ink min-h-[44px]">
              View receipt
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-10" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="border-[3px] border-ink bg-white h-[640px] animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] gap-10 items-stretch">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                inBag={bagCountFor(product.id)}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="border-[3px] border-dashed border-ink p-10 text-center">
            <p className="font-poster uppercase text-3xl">New merch is on the way.</p>
            <p className="mt-3">Check back soon.</p>
          </div>
        )}
      </section>

      {/* Sticky bag bar once something is in the bag */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-ink text-paper border-t-[3px] border-poster">
          <div className="gp-container py-3 flex items-center justify-between gap-4">
            <span className="gp-mono text-sm sm:text-base">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} · ₹{totalAmount.toFixed(0)}
            </span>
            <button type="button" onClick={openBag} className="gp-btn gp-btn-red min-h-[48px]">
              Checkout →
            </button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-paper overflow-y-auto font-archivo text-ink"
          role="dialog"
          aria-modal="true"
          aria-label="Your bag and checkout"
        >
          <div className="sticky top-0 z-10 bg-paper border-b-[3px] border-ink">
            <div className="gp-container py-3 flex items-center justify-between gap-4">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setIsCartOpen(false)}
                disabled={submitting}
                className="gp-mono text-sm font-bold min-h-[44px] disabled:opacity-40"
              >
                ← Back to merch
              </button>
              <span className="gp-mono text-[13px] inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Secure checkout
              </span>
            </div>
          </div>

          <div className="gp-container pt-6 sm:pt-8 pb-16">
            <ol
              aria-label="Checkout steps"
              className="grid grid-cols-4 border-[3px] border-ink gp-mono text-[11px] sm:text-sm font-bold uppercase"
            >
              {['Bag', 'Details', 'Pay', 'Done'].map((label, i) => {
                const n = i + 1;
                const state = n < step ? 'done' : n === step ? 'current' : 'todo';
                return (
                  <li
                    key={label}
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={`px-2 sm:px-4 py-3 sm:py-4 ${i < 3 ? 'border-r-[3px] border-ink' : ''} ${
                      state === 'done' ? 'bg-ink text-paper' : state === 'current' ? 'bg-poster text-white' : ''
                    }`}
                  >
                    0{n} {label}
                    {state === 'done' ? ' ✓' : ''}
                  </li>
                );
              })}
            </ol>

            {confirmed ? (
              <div className="max-w-xl mx-auto mt-10 bg-white border-[3px] border-ink shadow-hard p-6 sm:p-8 gp-mono">
                <p className="text-[13px] font-bold">04 · DONE</p>
                <h2 className="font-poster uppercase text-5xl leading-[0.95] mt-2">
                  You&apos;re in<span className="text-poster">!</span>
                </h2>
                <div className="border-y-2 border-dashed border-ink py-4 my-5 text-sm leading-loose">
                  <p>ORDER #{confirmed.orderId.slice(0, 8).toUpperCase()}</p>
                  {confirmed.items.map((item) => (
                    <p key={`${item.product.id}-${item.size}`}>
                      {item.quantity} × {item.product.name.toUpperCase()}
                      {item.size !== ONE_SIZE ? ` / ${item.size}` : ''} — ₹{(item.product.price * item.quantity).toFixed(0)}
                    </p>
                  ))}
                  <p className="font-bold mt-1">TOTAL ₹{confirmed.total.toFixed(0)} · PAID VIA RAZORPAY</p>
                </div>
                <p className="text-sm leading-relaxed">
                  {confirmed.emailSent
                    ? `A confirmation email is on its way to ${confirmed.email}. We'll email again when it ships.`
                    : "Your order is confirmed. We'll email you when it ships."}
                </p>
                <div className="flex flex-wrap gap-3 mt-6 font-archivo">
                  <button type="button" onClick={() => setIsCartOpen(false)} className="gp-btn gp-btn-ink">
                    Back to merch
                  </button>
                  <Link href="/" className="gp-btn gp-btn-outline">
                    Tarana home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckout} noValidate className="mt-8 flex flex-wrap gap-10 items-start">
                <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-8">
                  <section className="border-[3px] border-ink bg-white">
                    <h2 className="px-5 py-4 border-b-[3px] border-ink font-poster uppercase text-2xl">Your bag</h2>
                    {cart.length === 0 ? (
                      <div className="p-6 flex flex-wrap justify-between items-center gap-4">
                        <p>Your bag is empty.</p>
                        <button type="button" onClick={() => setIsCartOpen(false)} className="gp-btn gp-btn-red min-h-[44px]">
                          Shop the drop
                        </button>
                      </div>
                    ) : (
                      <ul>
                        {cart.map((item, index) => {
                          const max = maxFor(item);
                          const atMax = max !== null && item.quantity >= max;
                          const image = item.product.image_urls?.[0] || item.product.image_url;
                          return (
                            <li
                              key={`${item.product.id}-${item.size}`}
                              className={`flex flex-wrap gap-4 sm:gap-5 items-center p-5 ${index > 0 ? 'border-t-2 border-ink' : ''}`}
                            >
                              {image && (
                                <img
                                  src={image}
                                  alt=""
                                  className="w-20 h-24 object-cover border-2 border-ink"
                                  style={{ objectPosition: item.product.image_positions?.[0] || 'center' }}
                                />
                              )}
                              <div className="flex-[1_1_160px] min-w-0">
                                <p className="font-poster uppercase text-xl leading-tight">{item.product.name}</p>
                                <p className="gp-mono text-sm mt-1">
                                  {item.size !== ONE_SIZE ? `Size ${item.size} · ` : ''}₹{item.product.price.toFixed(0)}
                                </p>
                                {atMax && <p className="gp-mono text-xs text-poster-dark mt-1">That&apos;s all we have in this size</p>}
                              </div>
                              <div className="flex items-center border-2 border-ink">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, -1)}
                                  aria-label={`One less ${item.product.name}`}
                                  className="w-11 h-11 bg-white text-xl font-bold"
                                >
                                  −
                                </button>
                                <span className="min-w-[32px] text-center gp-mono font-bold" aria-live="polite">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(index, 1)}
                                  disabled={atMax}
                                  aria-label={atMax ? 'No more in stock' : `One more ${item.product.name}`}
                                  className="w-11 h-11 bg-white text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="min-h-[44px] px-2 gp-mono text-[13px] underline"
                              >
                                Remove
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>

                  {cart.length > 0 && (
                    <section className="border-[3px] border-ink bg-white">
                      <h2 className="px-5 py-4 border-b-[3px] border-ink font-poster uppercase text-2xl">Shipping details</h2>
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">{field('fullName', 'Full name', { autoComplete: 'name' })}</div>
                        {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
                        {field('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'Order updates go here' })}
                        <label className="gp-label sm:col-span-2">
                          Address line 1
                          <textarea
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleFormChange}
                            onBlur={markTouched}
                            required
                            rows={2}
                            autoComplete="address-line1"
                            aria-invalid={touched.addressLine1 && errors.addressLine1 ? true : undefined}
                            className="gp-input resize-y"
                          />
                          {touched.addressLine1 && errors.addressLine1 && (
                            <span className="font-normal normal-case text-poster-dark">{errors.addressLine1}</span>
                          )}
                        </label>
                        <div className="sm:col-span-2">
                          {field('addressLine2', 'Address line 2', { autoComplete: 'address-line2' }, true)}
                        </div>
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                          {field('city', 'City', { autoComplete: 'address-level2' })}
                          {field('state', 'State', { autoComplete: 'address-level1' })}
                          {field('pincode', 'Pincode', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6 })}
                        </div>
                        <p className="sm:col-span-2 gp-mono text-[13px]">
                          {checkoutConfig.disclaimer || DEFAULT_DISCLAIMER}
                        </p>
                      </div>
                    </section>
                  )}
                </div>

                <aside
                  aria-label="Order summary"
                  className="flex-[1_1_320px] min-w-0 lg:max-w-[420px] lg:sticky lg:top-24 bg-white border-[3px] border-ink shadow-hard p-6 gp-mono"
                >
                  <div className="text-center pb-4 border-b-2 border-dashed border-ink">
                    <p className="font-poster text-2xl uppercase">Tarana</p>
                    <h2 className="mt-1 text-[15px] font-bold uppercase tracking-widest">Order summary</h2>
                  </div>
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className="flex justify-between gap-3 py-3 text-[15px]">
                      <span>
                        {item.quantity} × {item.product.name}
                        {item.size !== ONE_SIZE ? ` / ${item.size}` : ''}
                      </span>
                      <span>{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-4 mt-1 border-t-2 border-dashed border-ink text-2xl font-bold">
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(0)}</span>
                  </div>

                  {checkoutInfo && (
                    <p role="status" className="text-sm mb-3">
                      {checkoutInfo}
                    </p>
                  )}
                  {checkoutError && (
                    <div role="alert" className="text-sm mb-4 p-3 border-[3px] border-poster bg-[#FFF4F2] text-poster-dark">
                      {checkoutError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !!payDisabledReason}
                    aria-describedby={payDisabledReason ? 'pay-reason' : undefined}
                    className={`w-full min-h-[60px] font-archivo text-[17px] font-bold uppercase gp-btn ${
                      submitting || payDisabledReason ? 'bg-[#8F8A80] text-white' : 'gp-btn-red'
                    }`}
                  >
                    {submitting ? 'Opening Razorpay…' : checkoutError ? `Try again · ₹${totalAmount.toFixed(0)}` : `Pay ₹${totalAmount.toFixed(0)}`}
                  </button>
                  {payDisabledReason && !submitting && (
                    <p id="pay-reason" className="mt-2.5 text-[13px] text-center text-poster-dark">
                      {payDisabledReason}
                    </p>
                  )}
                  <p className="mt-4 text-xs leading-relaxed text-center">
                    Opens Razorpay securely
                    <br />
                    UPI · Cards · Netbanking · Wallets
                  </p>
                </aside>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
