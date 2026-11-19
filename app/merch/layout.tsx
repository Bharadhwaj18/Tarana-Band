import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SHARE_IMAGE } from '@/lib/seo';
import { isPageEnabled } from '@/lib/pageVisibility';

const description = 'Official Tarana merchandise. Shop the latest drops from the band and order directly from the website.';

export const metadata: Metadata = {
  title: 'Merchandise',
  description,
  alternates: { canonical: '/merch' },
  openGraph: {
    title: 'Merchandise | Tarana',
    description,
    url: 'https://taranaband.in/merch',
    images: [SHARE_IMAGE],
  },
  twitter: {
    title: 'Merchandise | Tarana',
    description,
    images: [SHARE_IMAGE.url],
  },
};

// Checked on every request so switching the page off in admin hides it straight away
export const dynamic = 'force-dynamic';

export default async function MerchLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPageEnabled('show_merch'))) notFound();
  return children;
}
