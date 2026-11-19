'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppConfig } from './AppConfigProvider';

interface NavigationConfig {
  logo_black?: string;
  logo_white?: string;
  show_about?: boolean;
  show_tours?: boolean;
  show_merch?: boolean;
  show_videos?: boolean;
  show_contact?: boolean;
}

interface NavigationProps {
  config?: NavigationConfig;
  /** Kept for older callers; the poster header is always a solid paper bar. */
  isOverlay?: boolean;
}

const NAV_ITEMS = [
  { href: '/about', label: 'About', configKey: 'show_about' as const },
  { href: '/tours', label: 'Shows', configKey: 'show_tours' as const },
  { href: '/videos', label: 'Videos', configKey: 'show_videos' as const },
  { href: '/contact', label: 'Contact', configKey: 'show_contact' as const },
];

export default function Navigation({ config }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { navConfig } = useAppConfig();
  const resolved: NavigationConfig = { ...navConfig, ...(config || {}) };

  // A tab only shows once its flag has loaded and is on, so hidden pages never flash in
  const items = NAV_ITEMS.filter((item) => resolved[item.configKey] === true);
  const showMerch = resolved.show_merch === true;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="gp relative z-30 border-b-[3px] border-ink">
      <div className="gp-container flex items-center justify-between gap-4 py-3">
        <Link href="/" aria-label="Tarana home" className="flex items-center min-h-[44px]">
          {resolved.logo_black ? (
            <img src={resolved.logo_black} alt="Tarana" className="h-12 sm:h-14 w-auto" />
          ) : (
            <span className="gp-display text-3xl">Tarana</span>
          )}
        </Link>

        <nav aria-label="Main" className="hidden md:flex items-center gap-7 gp-mono text-sm font-bold uppercase">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`py-2 hover:text-poster-dark ${
                isActive(item.href) ? 'underline decoration-[3px] underline-offset-[6px]' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          {showMerch && (
            <Link
              href="/merch"
              aria-current={isActive('/merch') ? 'page' : undefined}
              className="gp-btn gp-btn-red min-h-[44px] px-5 text-sm"
            >
              Merch ↗
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="md:hidden gp-btn gp-btn-ink min-h-[44px] px-4 gp-mono text-sm uppercase"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="md:hidden border-t-[3px] border-ink bg-paper"
        >
          <ul className="gp-container py-2">
            {pathname !== '/' && (
              <li>
                <Link href="/" className="block py-4 border-b border-ink gp-display text-3xl">
                  Home
                </Link>
              </li>
            )}
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`block py-4 border-b border-ink gp-display text-3xl ${
                    isActive(item.href) ? 'text-poster' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {showMerch && (
              <li className="py-4">
                <Link href="/merch" className="gp-btn gp-btn-red w-full text-lg">
                  Merch ↗
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
