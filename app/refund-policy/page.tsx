import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'When Tarana merch orders can be cancelled, replaced or refunded.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      currentHref="/refund-policy"
      eyebrow="Cancellations & refunds"
      title="Refund Policy"
      intro={
        <p>
          We pack every order by hand and want it to reach you in perfect shape. Here is what happens if something goes
          wrong or you change your mind.
        </p>
      }
      sections={[
        {
          heading: 'Cancelling an order',
          body: (
            <p>
              You can cancel your order any time before it has been shipped. Email us at{' '}
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your order number and we&apos;ll refund you in
              full. Once an order has been shipped it can no longer be cancelled.
            </p>
          ),
        },
        {
          heading: 'Damaged or wrong items',
          body: (
            <>
              <p>
                If your item arrives damaged or defective, or we sent the wrong item or size, we&apos;ll replace it or give
                you a full refund, whichever you prefer.
              </p>
              <p>
                Please email us within <strong>7 days of delivery</strong> with your order number and clear photos of the
                item and packaging. We may ask you to send the item back; if so, we cover the return postage.
              </p>
            </>
          ),
        },
        {
          heading: 'Change of mind',
          body: (
            <p>
              As we&apos;re a small band with limited stock, we can&apos;t offer refunds or exchanges for change of mind or
              for ordering the wrong size. Please check the size details before you order, and email us if you&apos;re
              unsure.
            </p>
          ),
        },
        {
          heading: 'How refunds are paid',
          body: (
            <p>
              Approved refunds go back to the original payment method (card, UPI, net banking or wallet). We start the refund
              within 2 working days of approving it, and it usually reaches your account within 5 to 7 working days,
              depending on your bank.
            </p>
          ),
        },
        {
          heading: 'Orders we cancel',
          body: (
            <p>
              If we have to cancel your order, for example because an item went out of stock, we&apos;ll email you and refund
              the full amount you paid.
            </p>
          ),
        },
        {
          heading: 'Contact',
          body: (
            <p>
              For any cancellation or refund, email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call{' '}
              {BUSINESS.phone}. Requests are handled by {BUSINESS.operator}.
            </p>
          ),
        },
      ]}
    />
  );
}
