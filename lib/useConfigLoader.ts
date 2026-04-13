'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export interface NavigationConfig {
  logo_black?: string;
  logo_white?: string;
  show_about?: boolean;
  show_tours?: boolean;
  show_merch?: boolean;
  show_videos?: boolean;
  show_contact?: boolean;
}

export interface FontConfig {
  display_font?: string;
  body_font?: string;
}

export interface SocialConfig {
  social_links?: Array<{ platform: string; url: string }>;
}

export interface FullConfig {
  navConfig: NavigationConfig;
  fontConfig: FontConfig;
  socialConfig: SocialConfig;
  isLoaded: boolean;
}

export function useConfigLoader(): FullConfig {
  const [navConfig, setNavConfig] = useState<NavigationConfig>({});
  const [fontConfig, setFontConfig] = useState<FontConfig>({});
  const [socialConfig, setSocialConfig] = useState<SocialConfig>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setIsLoaded(true);
        return;
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        // Fetch all general config at once
        const { data: generalData } = await supabase
          .from('general_config')
          .select('*')
          .eq('is_active', true);

        if (generalData) {
          const generalConfig: any = {};
          generalData.forEach((item: any) => {
            generalConfig[item.section_name] = item.content;
          });

          // Set navigation config
          const navCfg: NavigationConfig = {
            logo_black: generalConfig.branding?.logo_black,
            logo_white: generalConfig.branding?.logo_white,
            show_about: generalConfig.navigation?.show_about !== false,
            show_tours: generalConfig.navigation?.show_tours !== false,
            show_merch: generalConfig.navigation?.show_merch !== false,
            show_videos: generalConfig.navigation?.show_videos !== false,
            show_contact: generalConfig.navigation?.show_contact !== false,
          };
          setNavConfig(navCfg);

          // Set font config
          const fontCfg: FontConfig = {
            display_font: generalConfig.fonts?.display_font,
            body_font: generalConfig.fonts?.body_font,
          };
          setFontConfig(fontCfg);

          // Set social config
          const socialCfg: SocialConfig = {
            social_links: generalConfig.social?.social_links,
          };
          setSocialConfig(socialCfg);

          // Apply fonts to document
          if (fontCfg.display_font) {
            document.documentElement.style.setProperty('--font-display', fontCfg.display_font);
          }
          if (fontCfg.body_font) {
            document.documentElement.style.setProperty('--font-body', fontCfg.body_font);
          }
        }

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading config:', error);
        setIsLoaded(true);
      }
    };

    fetchConfig();
  }, []);

  return {
    navConfig,
    fontConfig,
    socialConfig,
    isLoaded,
  };
}
