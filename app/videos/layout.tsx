import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SHARE_IMAGE } from '@/lib/seo';
import { isPageEnabled } from '@/lib/pageVisibility';

const description = 'Watch Tarana live performances, music videos and more.';

export const metadata: Metadata = {
  title: 'Videos',
  description,
  alternates: { canonical: '/videos' },
  openGraph: {
    title: 'Videos | Tarana',
    description,
    url: 'https://taranaband.in/videos',
    images: [SHARE_IMAGE],
  },
  twitter: {
    title: 'Videos | Tarana',
    description,
    images: [SHARE_IMAGE.url],
  },
};

// Checked on every request so switching the page off in admin hides it straight away
export const dynamic = 'force-dynamic';

export default async function VideosLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPageEnabled('show_videos'))) notFound();
  return children;
}
