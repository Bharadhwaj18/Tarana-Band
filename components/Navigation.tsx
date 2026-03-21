'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

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
  isOverlay?: boolean;
  config?: NavigationConfig;
}

export default function Navigation({ isOverlay = false, config }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Detect scroll position to change header background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Build nav items based on config
  const baseNavItems = [
    { href: '/', label: 'Home', configKey: 'home' as const },
    { href: '/about', label: 'About Us', configKey: 'show_about' as const },
    { href: '/tours', label: 'Tours', configKey: 'show_tours' as const },
    { href: '/merch', label: 'Merch', configKey: 'show_merch' as const },
    { href: '/videos', label: 'Videos', configKey: 'show_videos' as const },
    { href: '/contact', label: 'Contact', configKey: 'show_contact' as const },
  ];

  // Filter nav items based on config (default to true if config not provided)
  const navItems = baseNavItems.filter(item => {
    // Hide Home link when on home page
    if (item.href === '/' && pathname === '/') {
      return false;
    }
    // Always show Home when not on home page
    if (item.configKey === 'home') {
      return true;
    }
    if (!config || config[item.configKey] === undefined) {
      return true; // Show by default
    }
    return config[item.configKey];
  });

  const containerClass = isOverlay
    ? `fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-sm' : 'bg-transparent'
      }`
    : 'bg-black text-white';

  return (
    <nav className={`${containerClass} text-white`}>
      <div className="container-custom flex justify-between items-center py-2">
        {/* Logo or Brand */}
        <Link href="/">
          {isOverlay && isScrolled ? (
            // Show black logo when scrolled (dark background) - SMALL SIZE
            config?.logo_black && (
              <img
                src={config.logo_black}
                alt="TARANA Logo"
                className={`h-14 object-contain`}
                title="TARANA"
              />
            )
          ) : isOverlay && !isScrolled ? (
            // Show white logo when at top (transparent background) - SMALL SIZE
            config?.logo_white && (
              <img
                src={config.logo_white}
                alt="TARANA Logo"
                className={`h-14 object-contain`}
                title="TARANA"
              />
            )
          ) : (
            // For non-overlay navigation, use black logo - SMALL SIZE
            config?.logo_black && (
              <img
                src={config.logo_black}
                alt="TARANA Logo"
                className={`h-16 object-contain`}
                title="TARANA"
              />
            )
          )}
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-gray-300 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/admin" className="btn-secondary py-2 px-4">
            Admin
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className={`md:hidden transition-all duration-300 ${
          isOverlay
            ? isScrolled ? 'bg-black/90' : 'bg-black/80'
            : 'bg-gray-900'
        } p-4 space-y-4`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block hover:text-gray-300 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="block btn-secondary py-2 px-4 text-center"
            onClick={() => setIsOpen(false)}
          >
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
