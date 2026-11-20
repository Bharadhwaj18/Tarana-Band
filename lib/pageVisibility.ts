// Server-side check for the page switches in admin -> Settings -> Navigation.
// A page switched off there returns 404, so it can't be reached by typing the URL either.

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { IS_LOCAL_DEV } from './localDev';

export type PageKey = 'show_about' | 'show_tours' | 'show_merch' | 'show_videos' | 'show_contact';


export async function getNavigationFlags(): Promise<Partial<Record<PageKey, boolean>> | null> {
  if (IS_LOCAL_DEV) return {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    // no-store: a switch flipped in admin takes effect on the next request, not after a cache expires
    const response = await fetch(
      `${url}/rest/v1/general_config?select=content&section_name=eq.navigation&is_active=eq.true&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
    );
    if (!response.ok) return null;
    const rows = await response.json();
    return rows?.[0]?.content || {};
  } catch (error) {
    console.error('Could not load page switches:', error);
    return null;
  }
}

/**
 * True unless the page is switched off in admin.
 * If the settings can't be loaded the page stays available, so a database hiccup never takes the site down.
 */
export async function isPageEnabled(page: PageKey): Promise<boolean> {
  if (page === 'show_merch' && hasReviewAccess()) return true;
  const flags = await getNavigationFlags();
  return flags?.[page] !== false;
}

// ---- Private reviewer access ----
// Lets someone with the secret link (e.g. a payment gateway reviewer) see the merch shop while it is
// switched off for everyone else. The link is /api/review?key=<REVIEW_ACCESS_KEY>; it sets a cookie.

export const REVIEW_COOKIE = 'tarana_review';

export function isValidReviewKey(candidate: string | undefined | null): boolean {
  const secret = process.env.REVIEW_ACCESS_KEY;
  if (!secret || !candidate) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(candidate);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function hasReviewAccess(): boolean {
  try {
    return isValidReviewKey(cookies().get(REVIEW_COOKIE)?.value);
  } catch {
    return false;
  }
}
