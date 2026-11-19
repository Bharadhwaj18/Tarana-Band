import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Where and how Tarana merch ships, and how long delivery takes.',
  alternates: { canonical: '/shipping-policy' },
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      currentHref="/shipping-policy"
      eyebrow="Delivery"
      title="Shipping Policy"
      intro={<p>How your Tarana merch gets from us to you.</p>}
      sections={[
        {
          heading: 'Where we ship',
          body: <p>We currently ship within India only. We don&apos;t ship internationally yet.</p>,
        },
        {
          heading: 'Shipping charges',
          body: <p>Shipping within India is included in the product price. There is no extra charge at checkout.</p>,
        },
        {
          heading: 'When it ships',
          body: (
            <p>
              Orders are packed and dispatched within <strong>7 working days</strong> of payment being confirmed. We email
              you when your order has been shipped.
            </p>
          ),
        },
        {
          heading: 'How it ships',
          body: (
            <p>
              All orders are sent through India Post. Delivery usually takes <strong>5 to 10 working days</strong> after
              dispatch, depending on your location. Remote areas can take a little longer.
            </p>
          ),
        },
        {
          heading: 'Address and delivery issues',
          body: (
            <>
              <p>
                Please double-check your address, PIN code and phone number at checkout. If a parcel is returned to us
                because of a wrong or incomplete address, we&apos;ll contact you to arrange re-sending.
              </p>
              <p>
                If your order hasn&apos;t arrived within 20 working days of dispatch, email us and we&apos;ll track it down
                with India Post.
              </p>
            </>
          ),
        },
        {
          heading: 'Contact',
          body: (
            <p>
              Questions about your delivery? Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call{' '}
              {BUSINESS.phone}. Orders are shipped by {BUSINESS.operator} from {BUSINESS.location}.
            </p>
          ),
        },
      ]}
    />
  );
}
