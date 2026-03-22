'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function FontSetter() {
  useEffect(() => {
    const loadFonts = async () => {
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
          .select('*')
          .eq('is_active', true)
          .eq('section_name', 'fonts');

        if (data && data.length > 0) {
          const fontConfig = data[0].content;
          const displayFont = fontConfig.display_font || 'Righteous';
          const bodyFont = fontConfig.body_font || 'Poppins';

          // Load the fonts from Google Fonts
          const fontLink = document.createElement('link');
          fontLink.href = `https://fonts.googleapis.com/css2?family=${displayFont.replace(/\s+/g, '+')}&family=${bodyFont.replace(/\s+/g, '+')}&display=swap`;
          fontLink.rel = 'stylesheet';
          document.head.appendChild(fontLink);

          // Apply fonts via CSS variables
          const style = document.createElement('style');
          style.innerHTML = `
            :root {
              --font-display: '${displayFont}', sans-serif;
              --font-body: '${bodyFont}', sans-serif;
            }
            body {
              font-family: var(--font-body);
            }
            .heading-display, .heading-lg, .heading-md, .font-display {
              font-family: var(--font-display);
            }
          `;
          document.head.appendChild(style);
        }
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };

    loadFonts();
  }, []);

  return null;
}
