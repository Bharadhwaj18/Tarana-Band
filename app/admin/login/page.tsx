'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured. Please check your environment variables.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? "That email and password don't match. Try again."
            : authError.message
        );
        return;
      }

      if (data.user) {
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-wrap bg-paper text-ink font-archivo">
      <section className="flex-[1_1_520px] min-w-0 bg-ink text-paper p-8 sm:p-14 flex flex-col justify-between gap-10">
        <img src="/logo-white.png" alt="Tarana" className="h-16 w-auto self-start" />
        <div>
          <p className="gp-mono text-sm uppercase text-poster-light mb-4">Band only</p>
          <h1 className="gp-display text-[clamp(72px,9vw,140px)] leading-[0.84]">
            Back
            <br />
            stage<span className="text-poster">.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#D6D0C4] max-w-[36ch]">
            Shows, merch orders, photos, videos and messages. Everything that runs taranaband.in.
          </p>
        </div>
        <p className="gp-mono text-xs text-[#B8B2A6]">
          Not in the band?{' '}
          <Link href="/" className="text-paper underline underline-offset-4">
            Back to the site →
          </Link>
        </p>
      </section>

      <section className="flex-[1_1_440px] min-w-0 flex items-center justify-center px-6 py-14">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[440px] bg-white border-[3px] border-ink shadow-hard-red"
        >
          <h2 className="px-6 py-4 border-b-[3px] border-ink font-poster uppercase text-[28px]">Sign in</h2>
          <div className="p-6 flex flex-col gap-5">
            <label className="gp-label">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="gp-input"
              />
            </label>
            <label className="gp-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                className="gp-input"
              />
            </label>
            {error && (
              <p id="login-error" role="alert" className="gp-mono text-[13px] text-poster-dark -mt-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="gp-btn gp-btn-ink min-h-[58px] text-[17px] uppercase tracking-wide disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
