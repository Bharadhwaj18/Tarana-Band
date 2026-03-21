'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { href: '/admin/homepage', label: 'Homepage', icon: '🏠' },
    { href: '/admin/members', label: 'Band Members', icon: '👥' },
    { href: '/admin/tours', label: 'Tours & Events', icon: '🎤' },
    { href: '/admin/merch', label: 'Merchandise', icon: '🛍️' },
    { href: '/admin/videos', label: 'Videos', icon: '🎥' },
    { href: '/admin/contact-submissions', label: 'Contact Messages', icon: '📧' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Welcome back! Logged in as <span className="text-gold">{user.email}</span>
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-gray-800 rounded-lg shadow hover:shadow-xl hover:shadow-gold/20 transition-all p-6 block border border-gray-700 hover:border-gold"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-white hover:text-gold transition-colors">
                {item.label}
              </h3>
              <p className="text-gray-400 text-sm mt-2">Manage {item.label.toLowerCase()}</p>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Band Members</p>
              <p className="text-3xl font-bold text-gold mt-2">7</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Manage Content</p>
              <p className="text-3xl font-bold text-gold mt-2">📱</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Support</p>
              <p className="text-lg text-gold mt-2">
                <a href="/" className="hover:underline">Back to Site</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
