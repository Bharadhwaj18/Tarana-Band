import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import OrderCard from '@/components/OrderCard';
import OrderLookup from '@/components/OrderLookup';
import { orderById, type CustomerOrder } from '@/lib/customerOrders';
import { isValidOrderToken } from '@/lib/orderAccess';

export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const dynamic = 'force-dynamic';

// One order, opened from the "View your order" button in an order email or from order number + email.
export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { t?: string } }) {
  const token = typeof searchParams.t === 'string' ? searchParams.t : '';
  let order: CustomerOrder | null = null;
  let failed = false;
  if (isValidOrderToken(params.id, token)) {
    try {
      order = await orderById(params.id);
    } catch (error) {
      console.error('Order load failed:', error);
      failed = true;
    }
  }

  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-12 sm:pt-14 pb-20 sm:pb-24">
        <p className="gp-mono text-sm uppercase mb-3">Tarana merch</p>
        <h1 className="gp-display text-[clamp(48px,9vw,128px)] leading-[0.86]">
          Your order<span className="text-poster">.</span>
        </h1>

        {order ? (
          <div className="mt-8 max-w-[820px]">
            <OrderCard order={order} />
          </div>
        ) : failed ? (
          <p className="mt-10 text-lg">We couldn&apos;t load your order just now. Please refresh in a minute.</p>
        ) : (
          <div className="mt-10">
            <OrderLookup notice={'We couldn’t open that order from this link. Find it below instead.'} />
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-4">
          {order && (
            <Link href="/merch/orders" className="gp-btn gp-btn-ink">
              See all my orders
            </Link>
          )}
          <Link href="/merch" className="gp-btn gp-btn-outline">
            Back to the shop
          </Link>
          <Link href="/contact" className="gp-btn gp-btn-outline">
            Need help? Contact us
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
