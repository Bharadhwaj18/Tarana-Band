import type { Metadata } from 'next';
import Link from 'next/link';
import PolicyPage from '@/components/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms for using taranaband.in and buying Tarana merchandise.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <PolicyPage
      currentHref="/terms"
      eyebrow="The fine print"
      title="Terms & Conditions"
      intro={
        <p>
          These terms apply when you use taranaband.in or buy Tarana merchandise from it. The site and merch store are
          operated by {BUSINESS.operator}, trading as {BUSINESS.brand}, based in {BUSINESS.location} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By using the site or placing an order you agree to these terms.
        </p>
      }
      sections={[
        {
          heading: 'Using the site',
          body: (
            <>
              <p>
                You may browse the site, watch our videos and contact us for personal, non-commercial use. Please don&apos;t
                misuse the site, try to break its security, or send spam through the contact form.
              </p>
              <p>
                Music, videos, photos, logos and text on the site belong to Tarana or the people credited. Don&apos;t copy or
                reuse them commercially without our written permission.
              </p>
            </>
          ),
        },
        {
          heading: 'Products and prices',
          body: (
            <>
              <p>
                We sell band merchandise such as t-shirts and other apparel. We try to show colours and sizes accurately, but
                screens differ and small variations can happen.
              </p>
              <p>
                All prices are in Indian Rupees (INR) and include shipping within India. Stock is limited, and an item is only
                reserved for you once your payment is confirmed.
              </p>
            </>
          ),
        },
        {
          heading: 'Orders and payment',
          body: (
            <>
              <p>
                Payment is taken online at checkout through our payment partner. We never see or store your card, UPI or
                bank details. Your order is confirmed once payment succeeds, and we send a confirmation email.
              </p>
              <p>
                We may cancel an order and refund it in full if an item turns out to be out of stock, a price was shown
                wrongly, or the order looks fraudulent.
              </p>
            </>
          ),
        },
        {
          heading: 'Shipping, cancellations and refunds',
          body: (
            <p>
              How we deliver, and when you can cancel or get a refund, is covered in our{' '}
              <Link href="/shipping-policy">Shipping Policy</Link> and{' '}
              <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>. They are part of these terms.
            </p>
          ),
        },
        {
          heading: 'Tickets and events',
          body: (
            <p>
              Tickets for our shows are sold by the venue or a ticketing platform, not by us. Their terms apply to those
              purchases, and questions about ticket refunds should go to them.
            </p>
          ),
        },
        {
          heading: 'Liability',
          body: (
            <p>
              We provide the site as it is and do our best to keep it accurate and available. To the extent the law allows,
              our liability for any order is limited to the amount you paid for it.
            </p>
          ),
        },
        {
          heading: 'Governing law',
          body: (
            <p>
              These terms are governed by the laws of India. Any dispute will be handled by the courts in Bengaluru,
              Karnataka.
            </p>
          ),
        },
        {
          heading: 'Changes and contact',
          body: (
            <p>
              We may update these terms from time to time; the date at the top shows the latest version. Questions? Email{' '}
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call {BUSINESS.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
