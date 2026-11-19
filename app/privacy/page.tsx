import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';
import { BUSINESS } from '@/lib/business';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What information taranaband.in collects, why, and how it is kept.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      currentHref="/privacy"
      eyebrow="Your data"
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what information we collect when you use taranaband.in, why we collect it and how we look
          after it. The site is operated by {BUSINESS.operator}, trading as {BUSINESS.brand}, {BUSINESS.location}.
        </p>
      }
      sections={[
        {
          heading: 'What we collect',
          body: (
            <ul>
              <li>
                <strong>When you order merch:</strong> your name, email, phone number and shipping address, and what you
                ordered.
              </li>
              <li>
                <strong>When you contact us:</strong> your name, email and the message you send.
              </li>
              <li>
                <strong>When you browse:</strong> anonymous usage data such as pages visited and device type, through Google
                Analytics.
              </li>
            </ul>
          ),
        },
        {
          heading: 'Payments',
          body: (
            <p>
              Payments are handled by our payment partner on their secure checkout. We never see or store your card, UPI or
              bank details. We only receive confirmation that the payment succeeded and its reference number.
            </p>
          ),
        },
        {
          heading: 'How we use it',
          body: (
            <ul>
              <li>To process, ship and support your order, and to email you about it.</li>
              <li>To reply to your messages and booking enquiries.</li>
              <li>To understand how the site is used so we can improve it.</li>
            </ul>
          ),
        },
        {
          heading: 'Who we share it with',
          body: (
            <>
              <p>We don&apos;t sell or rent your information. We only share what&apos;s needed with:</p>
              <ul>
                <li>India Post, to deliver your order (name, phone and address).</li>
                <li>Our payment partner, to take your payment.</li>
                <li>The services that run the site: hosting, database, email delivery and Google Analytics.</li>
              </ul>
              <p>We may also share information if the law requires it.</p>
            </>
          ),
        },
        {
          heading: 'Cookies',
          body: (
            <p>
              The site uses browser storage for small things like remembering that you&apos;ve already seen the intro
              animation, and Google Analytics cookies to count visits. You can block cookies in your browser settings and the
              site will still work.
            </p>
          ),
        },
        {
          heading: 'Keeping it safe',
          body: (
            <p>
              Your information is stored with reputable providers over encrypted connections, and only the people who run the
              merch store can see order details. We keep order records for as long as we need them for shipping, support,
              accounting and legal reasons.
            </p>
          ),
        },
        {
          heading: 'Your choices',
          body: (
            <p>
              You can ask to see, correct or delete the information we hold about you by emailing{' '}
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>. Some order records may need to be kept for legal or
              tax reasons.
            </p>
          ),
        },
        {
          heading: 'Changes and contact',
          body: (
            <p>
              We may update this policy; the date at the top shows the latest version. For any privacy question, contact{' '}
              {BUSINESS.operator} at <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or {BUSINESS.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
