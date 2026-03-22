'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ColorSetter() {
  useEffect(() => {
    const loadColors = async () => {
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
          .eq('section_name', 'colors');

        if (data && data.length > 0) {
          const colorConfig = data[0].content;
          const primaryColor = colorConfig.primary_color || '#000000';
          const secondaryColor = colorConfig.secondary_color || '#FFD700';

          // Apply colors via CSS variables
          const style = document.createElement('style');
          style.innerHTML = `
            :root {
              --primary: ${primaryColor};
              --secondary: ${secondaryColor};
              --gold: ${secondaryColor};
              --gold-light: ${secondaryColor}CC;
              --gold-dark: ${secondaryColor}99;
            }
          `;
          document.head.appendChild(style);
        }
      } catch (error) {
        console.error('Error loading colors:', error);
      }
    };

    loadColors();
  }, []);

  return null;
}
