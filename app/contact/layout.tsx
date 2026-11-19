import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SHARE_IMAGE } from '@/lib/seo';
import { isPageEnabled } from '@/lib/pageVisibility';

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

// Checked on every request so switching the page off in admin hides it straight away
export const dynamic = 'force-dynamic';

export default async function ContactLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPageEnabled('show_contact'))) notFound();
  return children;
}
