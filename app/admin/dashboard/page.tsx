'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push('/admin/login');
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { href: '/admin/members', label: 'Band Members', icon: '👥' },
    { href: '/admin/tours', label: 'Tours & Events', icon: '🎤' },
    { href: '/admin/merch', label: 'Merchandise', icon: '🛍️' },
    { href: '/admin/videos', label: 'Videos', icon: '🎥' },
    { href: '/admin/contact-submissions', label: 'Contact Submissions', icon: '📧' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-black text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">TARANA Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Logged in as {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          <p className="text-gray-600">
            Manage all Tarana website content from here.
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 hover:text-red-600 transition-colors">
                {item.label}
              </h3>
              <p className="text-gray-600 text-sm mt-2">Manage {item.label.toLowerCase()}</p>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Band Members</p>
              <p className="text-3xl font-bold text-red-600 mt-2">7</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Manage Content</p>
              <p className="text-3xl font-bold text-red-600 mt-2">📱</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Support</p>
              <p className="text-lg text-red-600 mt-2">
                <a href="/" className="hover:underline">Back to Site</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
