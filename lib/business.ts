// Who sells the merch, shown on the policy pages and contact page.
// Payment gateways check these against the KYC, so keep them matching what was submitted.

export const BUSINESS = {
  brand: 'Tarana',
  operator: 'Harsh Makam',
  location: 'Bengaluru, Karnataka, India',
  email: 'taranabandinfo@gmail.com',
  phone: '+91 94495 62419',
  website: 'https://taranaband.in',
};

export const POLICIES_UPDATED = '19 November 2026';

export const POLICY_LINKS = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Cancellation & Refunds' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
];
