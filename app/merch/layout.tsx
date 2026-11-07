import type { Metadata } from 'next';
import { SHARE_IMAGE } from '@/lib/seo';

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

export default function MerchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
