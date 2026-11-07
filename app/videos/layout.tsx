import type { Metadata } from 'next';
import { SHARE_IMAGE } from '@/lib/seo';

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

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
