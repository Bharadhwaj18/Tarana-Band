import { NextRequest, NextResponse } from 'next/server';
import { REVIEW_COOKIE, isValidReviewKey } from '@/lib/pageVisibility';

// Private link for reviewers: /api/review?key=<REVIEW_ACCESS_KEY>
// A right key sets a cookie that lets that browser open the merch shop while it is switched off for everyone else.
// A wrong or missing key looks like any other missing page.
export async function GET(request: NextRequest) {
  if (!isValidReviewKey(request.nextUrl.searchParams.get('key'))) {
    return new NextResponse('Not found', { status: 404 });
  }

  const response = NextResponse.redirect(new URL('/merch', request.nextUrl.origin));
  response.cookies.set(REVIEW_COOKIE, process.env.REVIEW_ACCESS_KEY as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
  response.headers.set('X-Robots-Tag', 'noindex');
  return response;
}
