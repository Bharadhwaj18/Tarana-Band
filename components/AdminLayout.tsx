'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    { href: '/admin/homepage', label: 'Homepage', icon: '🏠' },
    { href: '/admin/about', label: 'About Page', icon: '📖' },
    { href: '/admin/gallery', label: 'Photo Gallery', icon: '📸' },
    { href: '/admin/members', label: 'Band Members', icon: '👥' },
    { href: '/admin/tours', label: 'Tours & Events', icon: '🎤' },
    { href: '/admin/merch', label: 'Merchandise', icon: '🛍️' },
    { href: '/admin/videos', label: 'Videos', icon: '🎥' },
    { href: '/admin/contact-submissions', label: 'Contact Messages', icon: '📧' },
  ];

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Sidebar - Desktop */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-black border-r border-gray-800 overflow-y-auto hidden lg:block z-20">
        <div className="p-6 border-b border-gray-800">
          <p className="text-gray-400 text-sm mb-3">Admin Panel</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm transition-colors"
          >
            <span>←</span>
            <span>Back to Site</span>
          </Link>
        </div>

        <nav className="mt-6 space-y-1">
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

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-6 bg-black">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed left-0 top-0 w-64 h-screen bg-black border-r border-gray-800 overflow-y-auto lg:hidden z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-800">
          <p className="text-gray-400 text-sm mb-3">Admin Panel</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm transition-colors"
            onClick={handleNavClick}
          >
            <span>←</span>
            <span>Back to Site</span>
          </Link>
        </div>

        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={handleNavClick}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-6 bg-black">
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
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
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
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
