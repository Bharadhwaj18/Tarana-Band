'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/homepage', label: 'Homepage', icon: '🏠' },
    { href: '/admin/about', label: 'About Page', icon: '📖' },
    { href: '/admin/gallery', label: 'Photo Gallery', icon: '📸' },
    { href: '/admin/members', label: 'Band Members', icon: '👥' },
    { href: '/admin/tours', label: 'Tours & Events', icon: '🎤' },
    { href: '/admin/merch', label: 'Merchandise', icon: '🛍️' },
    { href: '/admin/videos', label: 'Videos', icon: '🎥' },
    { href: '/admin/contact-submissions', label: 'Contact Messages', icon: '📧' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-black text-white fixed w-64 h-screen overflow-y-auto hidden lg:block">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold">TARANA</h1>
          <p className="text-gray-400 text-sm">Admin Panel</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm transition-colors"
          >
            <span>←</span>
            <span>Back to Site</span>
          </Link>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center lg:hidden">
          <h1 className="text-xl font-bold text-gray-900">TARANA Admin</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Logout
          </button>
        </div>

        {/* Page Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
