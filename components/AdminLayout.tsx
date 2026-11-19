'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const MENU_GROUPS: { title?: string; items: { href: string; label: string }[] }[] = [
  { items: [{ href: '/admin/dashboard', label: 'Dashboard' }] },
  {
    title: 'Merch',
    items: [
      { href: '/admin/merch-orders', label: 'Orders' },
      { href: '/admin/merch', label: 'Products' },
      { href: '/admin/inventory', label: 'Stock' },
    ],
  },
  { title: 'Live', items: [{ href: '/admin/tours', label: 'Shows & events' }] },
  {
    title: 'Site',
    items: [
      { href: '/admin/homepage', label: 'Homepage' },
      { href: '/admin/about', label: 'About page' },
      { href: '/admin/members', label: 'Band members' },
      { href: '/admin/gallery', label: 'Photo gallery' },
      { href: '/admin/videos', label: 'Videos' },
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
  { title: 'Inbox', items: [{ href: '/admin/contact-submissions', label: 'Messages' }] },
];

// Bottom bar on phones: the four things the band does most
const MOBILE_TABS = [
  { href: '/admin/dashboard', label: 'Home' },
  { href: '/admin/merch-orders', label: 'Orders' },
  { href: '/admin/tours', label: 'Shows' },
  { href: '/admin/inventory', label: 'Stock' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toShip, setToShip] = useState<number | null>(null);

  // Badge on Orders: paid orders waiting to be shipped
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('merch_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .then(({ count }: { count: number | null }) => setToShip(count ?? null));
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5 text-[15px]">
      {MENU_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.title && (
            <span className="px-6 pt-5 pb-1.5 gp-mono text-[11px] uppercase text-[#8F8A80]">{group.title}</span>
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between min-h-[44px] px-6 transition-colors ${
                  active ? 'bg-poster text-white font-bold' : 'text-paper hover:bg-white/10'
                }`}
              >
                {item.label}
                {item.href === '/admin/merch-orders' && toShip ? (
                  <span
                    className={`gp-mono text-xs font-bold px-2 py-0.5 ${active ? 'bg-ink text-white' : 'bg-poster text-white'}`}
                  >
                    {toShip} to ship
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const footerLinks = (
    <div className="p-6 flex flex-col gap-3 gp-mono text-[13px]">
      <Link href="/" className="text-paper hover:text-poster-light w-fit">
        View live site ↗
      </Link>
      <button type="button" onClick={handleLogout} className="text-left text-[#B8B2A6] hover:text-paper w-fit">
        Sign out
      </button>
    </div>
  );

  return (
    <div className="admin-skin min-h-screen bg-paper text-ink font-archivo">
      {/* Sidebar on desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 w-64 h-screen bg-ink text-paper flex-col z-20">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <Link href="/admin/dashboard" aria-label="Backstage home">
            <img src="/logo-white.png" alt="Tarana" className="h-10 w-auto" />
          </Link>
          <span className="gp-mono text-[11px] uppercase text-poster-light">Backstage</span>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">{nav}</div>
        <div className="border-t border-white/15">{footerLinks}</div>
      </aside>

      {/* Top bar on phones and tablets */}
      <header className="lg:hidden sticky top-0 z-30 bg-ink text-paper flex items-center justify-between px-4 py-3">
        <Link href="/admin/dashboard" aria-label="Backstage home">
          <img src="/logo-white.png" alt="Tarana" className="h-8 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="admin-menu"
          className="min-h-[44px] px-4 border-2 border-paper gp-mono text-[13px] font-bold uppercase"
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </header>

      {menuOpen && (
        <div id="admin-menu" className="lg:hidden fixed inset-x-0 top-[68px] bottom-[62px] z-30 bg-ink text-paper overflow-y-auto">
          {nav}
          <div className="border-t border-white/15 mt-4">{footerLinks}</div>
        </div>
      )}

      <main className="lg:ml-64 px-4 sm:px-8 xl:px-12 pt-6 sm:pt-10 pb-28 lg:pb-16">
        <div className="max-w-6xl">{children}</div>
      </main>

      {/* Bottom tabs on phones */}
      <nav
        aria-label="Quick sections"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-4 bg-white border-t-[3px] border-ink gp-mono text-[11px] font-bold uppercase text-center"
      >
        {MOBILE_TABS.map((tab, i) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive(tab.href) ? 'page' : undefined}
            className={`flex items-center justify-center min-h-[60px] ${i < 3 ? 'border-r-2 border-ink' : ''} ${
              isActive(tab.href) ? 'bg-poster text-white' : ''
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
