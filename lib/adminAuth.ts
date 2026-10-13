import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin API routes run with the service role key, so the caller must prove
// they are signed in to the admin panel by sending their Supabase access token.
// Returns an error response to send back, or null when the caller is allowed.
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase server config is missing.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'Please log in to the admin panel again.' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: 'Please log in to the admin panel again.' }, { status: 401 });
  }

  return null;
}
