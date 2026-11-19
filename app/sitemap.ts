import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { getNavigationFlags, type PageKey } from '@/lib/pageVisibility';

export const dynamic = 'force-dynamic';

const PAGES: Array<{ path: string; key?: PageKey }> = [
  { path: '' },
  { path: '/about', key: 'show_about' },
  { path: '/tours', key: 'show_tours' },
  { path: '/merch', key: 'show_merch' },
  { path: '/videos', key: 'show_videos' },
  { path: '/contact', key: 'show_contact' },
  { path: '/terms' },
  { path: '/privacy' },
  { path: '/refund-policy' },
  { path: '/shipping-policy' },
];

// Pages switched off in admin are left out so Google doesn't index them
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const flags = await getNavigationFlags();
  const lastModified = new Date();

  return PAGES.filter((page) => !page.key || flags?.[page.key] !== false).map(({ path }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === '/tours' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
