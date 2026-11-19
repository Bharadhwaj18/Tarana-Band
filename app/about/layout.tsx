import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SHARE_IMAGE } from '@/lib/seo';
import { isPageEnabled } from '@/lib/pageVisibility';

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

// Checked on every request so switching the page off in admin hides it straight away
export const dynamic = 'force-dynamic';

export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPageEnabled('show_about'))) notFound();
  return children;
}
