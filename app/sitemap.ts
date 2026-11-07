import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/about', '/tours', '/merch', '/videos', '/contact'];
  const lastModified = new Date();

  return pages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === '/tours' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }));
}
