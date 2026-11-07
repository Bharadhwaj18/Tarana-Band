import type { Metadata } from 'next';

// Keep the admin panel out of search results
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
