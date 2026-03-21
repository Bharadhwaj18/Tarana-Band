import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return new NextResponse('No favicon configured', { status: 404 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch the branding config (which contains logos)
    const { data } = await supabase
      .from('general_config')
      .select('content')
      .eq('section_name', 'branding')
      .eq('is_active', true)
      .single();

    if (data?.content?.logo_white) {
      // Return a redirect to the white logo
      return NextResponse.redirect(data.content.logo_white, {
        status: 307, // Temporary redirect
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
        }
      });
    }

    return new NextResponse('No favicon configured', { status: 404 });
  } catch (error) {
    console.error('Error fetching favicon:', error);
    return new NextResponse('Error fetching favicon', { status: 500 });
  }
}

// Revalidate every 6 hours
export const revalidate = 21600;
