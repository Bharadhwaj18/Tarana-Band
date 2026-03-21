import { createClient } from '@supabase/supabase-js';

export async function fetchGeneralConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data } = await supabase
      .from('general_config')
      .select('*')
      .eq('is_active', true);

    if (!data) return null;

    const config: any = {};
    data.forEach((item: any) => {
      config[item.section_name] = item.content;
    });

    return {
      branding: config.branding || {},
      navigation: config.navigation || {},
      fonts: config.fonts || { display_font: 'Righteous', body_font: 'Poppins' },
      social: config.social || { social_links: [] },
    };
  } catch (error) {
    console.error('Error fetching general config:', error);
    return null;
  }
}
