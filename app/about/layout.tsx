import type { Metadata } from 'next';
import { SHARE_IMAGE } from '@/lib/seo';

const description = 'Meet Tarana, the band with classical roots and rock energy. Our story and the members behind the music.';

export const metadata: Metadata = {
  title: 'About',
  description,
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About | Tarana',
    description,
    url: 'https://taranaband.in/about',
    images: [SHARE_IMAGE],
  },
  twitter: {
    title: 'About | Tarana',
    description,
    images: [SHARE_IMAGE.url],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
