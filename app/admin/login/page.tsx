'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    if (!supabase) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
        <h1 className="text-4xl font-bold text-center mb-2 text-gold">TARANA</h1>
        <h2 className="text-xl font-semibold text-center mb-8 text-gray-300">Admin Login</h2>

        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-600 p-4 rounded mb-6">
            <p className="text-red-300 font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-gold text-white placeholder-gray-500"
              placeholder="admin@tarana.band"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:border-gold text-white placeholder-gray-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-light text-black font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Back to <a href="/" className="text-gold hover:text-gold-light transition-colors">website</a>
        </p>
      </div>
    </div>
  );
}
