import type { Metadata } from 'next';
import { SHARE_IMAGE } from '@/lib/seo';

const description = 'Get in touch with Tarana. Send us a message through the website contact form.';

export const metadata: Metadata = {
  title: 'Contact',
  description,
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact | Tarana',
    description,
    url: 'https://taranaband.in/contact',
    images: [SHARE_IMAGE],
  },
  twitter: {
    title: 'Contact | Tarana',
    description,
    images: [SHARE_IMAGE.url],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
