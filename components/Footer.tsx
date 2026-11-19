'use client';

import Link from 'next/link';
import { useAppConfig } from './AppConfigProvider';
import { BUSINESS, POLICY_LINKS } from '@/lib/business';

export const CONTACT_EMAIL = 'taranabandinfo@gmail.com';
export const CONTACT_PHONE = '+91 94495 62419';
export const CONTACT_PHONE_HREF = 'tel:+919449562419';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { navConfig, socialConfig } = useAppConfig();
  const logoWhite = navConfig.logo_white || '';
  const socialLinks = socialConfig.social_links || [];

  const siteLinks = [
    { href: '/', label: 'Home', show: true },
    { href: '/about', label: 'About', show: navConfig.show_about !== false },
    { href: '/tours', label: 'Shows', show: navConfig.show_tours !== false },
    { href: '/videos', label: 'Videos', show: navConfig.show_videos !== false },
    { href: '/merch', label: 'Merch', show: navConfig.show_merch !== false },
    { href: '/contact', label: 'Contact', show: navConfig.show_contact !== false },
  ].filter((link) => link.show);

  return (
    <footer className="bg-ink text-paper font-archivo">
      <div className="gp-container pt-16 sm:pt-20 pb-10 flex flex-wrap gap-12 justify-between">
        <div className="flex-[1_1_420px] min-w-0">
          <h2 className="gp-display text-[clamp(44px,5.5vw,72px)] mb-6">
            Stay
            <br />
            connected.
          </h2>
          <p className="text-[17px] leading-relaxed text-[#D6D0C4] max-w-[40ch] mb-6">
            Bookings, collabs or just a hello. Early tickets and behind-the-scenes on Instagram.
          </p>
          <div className="flex flex-wrap gap-3">
            {navConfig.show_contact !== false && (
              <Link href="/contact" className="gp-btn gp-btn-red">
                Get in touch →
              </Link>
            )}
            <a href={`mailto:${CONTACT_EMAIL}`} className="gp-btn gp-btn-outline text-paper">
              Email us
            </a>
          </div>
        </div>

        <nav aria-label="Site" className="flex-[0_1_180px] flex flex-col gap-3 gp-mono text-[15px]">
          <span className="text-xs uppercase text-[#B8B2A6]">Site</span>
          {siteLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-poster-light w-fit">
              {link.label}
            </Link>
          ))}
        </nav>

        {socialLinks.length > 0 && (
          <nav aria-label="Follow us" className="flex-[0_1_200px] flex flex-col gap-3 gp-mono text-[15px]">
            <span className="text-xs uppercase text-[#B8B2A6]">Follow</span>
            {socialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-poster-light w-fit"
              >
                {link.platform}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div className="gp-container pb-8">
        <div className="pt-6 border-t border-[#3A3833] flex items-center flex-wrap justify-between gap-4 gp-mono text-xs text-[#B8B2A6]">
          <div className="flex items-center gap-4">
            {logoWhite && <img src={logoWhite} alt="Tarana" className="h-10 w-auto" />}
            <p>
              © {currentYear} Tarana. All rights reserved.
              <br />
              Merch sold by {BUSINESS.operator}, {BUSINESS.location}.
            </p>
          </div>
          <nav aria-label="Policies" className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex items-center min-h-[32px] hover:text-paper underline-offset-2 hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin"
            className="inline-flex items-center min-h-[44px] px-4 border border-[#6B665C] text-paper uppercase hover:bg-paper hover:text-ink transition-colors"
          >
            Band login →
          </Link>
        </div>
      </div>
    </footer>
  );
}
