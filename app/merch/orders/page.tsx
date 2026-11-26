import type { Metadata } from 'next';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import OrderCard from '@/components/OrderCard';
import OrderLookup from '@/components/OrderLookup';
import { ordersForEmail, type CustomerOrder } from '@/lib/customerOrders';
import { readHistoryToken } from '@/lib/orderAccess';

// Private to whoever holds the link, so it stays out of search results and doesn't leak the link to other sites
export const metadata: Metadata = {
  title: 'Your orders',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const dynamic = 'force-dynamic';

export default async function OrderHistoryPage({ searchParams }: { searchParams: { t?: string } }) {
  const token = typeof searchParams.t === 'string' ? searchParams.t : '';
  const email = readHistoryToken(token);

  let orders: CustomerOrder[] = [];
  let failed = false;
  if (email) {
    try {
      orders = await ordersForEmail(email);
    } catch (error) {
      console.error('Order history load failed:', error);
      failed = true;
    }
  }

  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-12 sm:pt-14 pb-20 sm:pb-24">
        <p className="gp-mono text-sm uppercase mb-3">Tarana merch</p>
        <h1 className="gp-display text-[clamp(48px,9vw,128px)] leading-[0.86]">
          Your orders<span className="text-poster">.</span>
        </h1>

        {!email ? (
          <div className="mt-10">
            <OrderLookup notice={token ? 'That link has expired or isn’t valid. Ask for a new one below.' : undefined} />
          </div>
        ) : failed ? (
          <p className="mt-10 text-lg">We couldn&apos;t load your orders just now. Please refresh in a minute.</p>
        ) : orders.length === 0 ? (
          <p className="mt-10 text-lg max-w-[52ch]">There are no orders on this email yet. Orders show up here once the payment has gone through.</p>
        ) : (
          <>
            <p className="gp-mono text-sm mt-6 text-muted">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} on {email}
            </p>
            <div className="mt-8 flex flex-col gap-6 max-w-[820px]">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </>
        )}

        <div className="mt-12 flex flex-wrap gap-4">
          <Link href="/merch" className="gp-btn gp-btn-ink">
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
