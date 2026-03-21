'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface SocialLink {
  platform: string;
  url: string;
}

interface NavigationConfig {
  show_about?: boolean;
  show_tours?: boolean;
  show_merch?: boolean;
  show_videos?: boolean;
  show_contact?: boolean;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [logoBlack, setLogoBlack] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [navConfig, setNavConfig] = useState<NavigationConfig>({});

  useEffect(() => {
    const fetchConfig = async () => {
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
          .eq('is_active', true);

        if (data) {
          data.forEach((item: any) => {
            if (item.section_name === 'branding') {
              setLogoBlack(item.content.logo_black || '');
            }
            if (item.section_name === 'social') {
              setSocialLinks(item.content.social_links || []);
            }
            if (item.section_name === 'navigation') {
              setNavConfig(item.content);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching footer config:', error);
      }
    };

    fetchConfig();
  }, []);

  return (
    <footer className="bg-black text-white py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            {logoBlack && (
              <img
                src={logoBlack}
                alt="TARANA Logo"
                className="h-12 object-contain mb-4"
              />
            )}
            <h3 className="text-xl font-bold mb-4">TARANA</h3>
            <p className="text-gray-400">Official website of Tarana rock band.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              {(navConfig.show_about !== false) && (
                <li>
                  <a href="/about" className="hover:text-white transition">
                    About Us
                  </a>
                </li>
              )}
              {(navConfig.show_tours !== false) && (
                <li>
                  <a href="/tours" className="hover:text-white transition">
                    Tours
                  </a>
                </li>
              )}
              {(navConfig.show_merch !== false) && (
                <li>
                  <a href="/merch" className="hover:text-white transition">
                    Merchandise
                  </a>
                </li>
              )}
              {(navConfig.show_videos !== false) && (
                <li>
                  <a href="/videos" className="hover:text-white transition">
                    Videos
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              {(navConfig.show_contact !== false) && (
                <li>
                  <a href="/contact" className="hover:text-white transition">
                    Contact Form
                  </a>
                </li>
              )}
              <li>
                <a href="mailto:info@tarana.band" className="hover:text-white transition">
                  Email
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4 flex-wrap">
              {socialLinks.length > 0 ? (
                socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gold transition font-medium text-sm"
                    aria-label={link.platform}
                  >
                    {link.platform}
                  </a>
                ))
              ) : (
                <>
                  <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Instagram">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm0 2.75c2.49 0 2.79.01 3.78.048 1.41.064 2.178.39 2.69.648.68.264 1.164.578 1.674 1.088.51.51.824.994 1.088 1.674.258.512.584 1.28.648 2.69.038.99.048 1.29.048 3.78s-.01 2.79-.048 3.78c-.064 1.41-.39 2.178-.648 2.69-.264.68-.578 1.164-1.088 1.674-.51.51-.994.824-1.674 1.088-.512.258-1.28.584-2.69.648-.99.038-1.29.048-3.78.048s-2.79-.01-3.78-.048c-1.41-.064-2.178-.39-2.69-.648-.68-.264-1.164-.578-1.674-1.088-.51-.51-.824-.994-1.088-1.674-.258-.512-.584-1.28-.648-2.69-.038-.99-.048-1.29-.048-3.78s.01-2.79.048-3.78c.064-1.41.39-2.178.648-2.69.264-.68.578-1.164 1.088-1.674.51-.51.994-.824 1.674-1.088.512-.258 1.28-.584 2.69-.648.99-.038 1.29-.048 3.78-.048z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Facebook">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm3.605 8.912h-2.183v-1.714c0-.572.396-.704.675-.704h1.508v-2.404s-1.37-.234-2.68-.234c-2.953 0-3.925 1.994-3.925 3.289v1.767h-2.64v2.885h2.64v7.361h3.256v-7.361h2.55l.325-2.885z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition" aria-label="YouTube">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm4.441 16.892c-2.102.144-6.784.144-8.883 0-2.276-.156-2.541-1.27-2.558-4.892.017-3.623.282-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0 2.277.156 2.541 1.27 2.559 4.892-.018 3.623-.283 4.736-2.559 4.892zm-6.441-7.234l4.917 2.852-4.917 2.856v-5.708z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition" aria-label="Twitter">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm6.028 9.615c.01.162.015.323.015.485 0 4.99-3.797 10.742-10.74 10.742-2.133 0-4.116-.625-5.787-1.697.296.035.597.053.902.053 1.77 0 3.397-.604 4.688-1.615-1.652-.031-3.046-1.121-3.526-2.621.23.036.468.055.712.055.344 0 .678-.044 1.002-.128-1.727-.346-3.028-1.87-3.028-3.696 0-.016 0-.032 0-.048.509.283 1.092.452 1.71.473-1.013-.678-1.68-1.832-1.68-3.143 0-.691.186-1.34.512-1.898 1.86 2.286 4.644 3.787 7.765 3.945-.064-.275-.097-.561-.097-.854 0-2.069 1.677-3.745 3.744-3.745 1.077 0 2.048.454 2.73 1.179 1.072-.212 2.082-.605 2.991-1.147-.352 1.1-1.1 2.022-2.074 2.605.955-.115 1.864-.368 2.712-.744-.632.94-1.43 1.768-2.348 2.432z" />
                    </svg>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-gray-400">© {currentYear} Tarana. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
