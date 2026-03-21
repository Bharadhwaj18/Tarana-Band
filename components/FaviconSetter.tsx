'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function FaviconSetter() {
  useEffect(() => {
    const setFaviconFromConfig = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return;
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data } = await supabase
          .from('general_config')
          .select('content')
          .eq('section_name', 'branding')
          .eq('is_active', true)
          .single();

        if (data?.content?.logo_white) {
          // Find or create favicon link elements
          let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          let shortcutFavicon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;

          if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/png';
            document.head.appendChild(favicon);
          }

          if (!shortcutFavicon) {
            shortcutFavicon = document.createElement('link');
            shortcutFavicon.rel = 'shortcut icon';
            shortcutFavicon.type = 'image/png';
            document.head.appendChild(shortcutFavicon);
          }

          // Set favicons to the white logo from config
          favicon.href = data.content.logo_white;
          shortcutFavicon.href = data.content.logo_white;
        }
      } catch (error) {
        console.error('Error setting favicon from config:', error);
      }
    };

    setFaviconFromConfig();
  }, []);

  return null;
}
