'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        router.push('/admin/dashboard');
      } else {
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
