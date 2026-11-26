'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// How a customer asks for their orders: either an emailed link to all of them, or order number + email for one.
type Mode = 'link' | 'number';

export default function OrderLookup({ notice }: { notice?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setSent(false);
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(mode === 'link' ? '/api/merch-order/history-link' : '/api/merch-order/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'link' ? { email } : { email, orderNumber }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else if (mode === 'link') {
        setSent(true);
      } else if (data.url) {
        router.push(data.url);
        return;
      }
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    }
    setBusy(false);
  }

  return (
    <div className="border-[3px] border-ink bg-white p-5 sm:p-7 max-w-[620px]">
      {notice && <p className="gp-mono text-sm mb-5 border-[3px] border-poster text-poster-dark p-3">{notice}</p>}

      <div role="tablist" className="flex flex-wrap gap-2 mb-6">
        {([
          ['link', 'Email me a link'],
          ['number', 'Order number + email'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => switchMode(key)}
            className={`gp-mono text-sm uppercase font-bold px-4 min-h-[44px] border-[3px] border-ink ${
              mode === key ? 'bg-ink text-paper' : 'bg-white text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sent ? (
        <div role="status">
          <p className="gp-display text-3xl leading-none">Check your inbox.</p>
          <p className="mt-3 text-[16px] leading-relaxed">
            If there are orders on <strong>{email}</strong>, we&apos;ve sent a link to see them. It works for an hour. Nothing there? Look in
            spam, and check you used the same email you ordered with.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-[16px] leading-relaxed">
            {mode === 'link'
              ? 'Enter the email you ordered with and we’ll send you a link to all your orders.'
              : 'Enter the order number from your confirmation email (like #0D545C99) and the email you ordered with.'}
          </p>
          {mode === 'number' && (
            <label className="gp-label">
              Order number
              <input
                className="gp-input"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="#0D545C99"
                autoCapitalize="characters"
                autoComplete="off"
                required
              />
            </label>
          )}
          <label className="gp-label">
            Email
            <input
              className="gp-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          {error && (
            <p role="alert" className="gp-mono text-sm text-poster-dark">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="gp-btn gp-btn-red min-h-[48px] self-start disabled:opacity-60">
            {busy ? 'One moment…' : mode === 'link' ? 'Email me the link' : 'Find my order'}
          </button>
        </form>
      )}
    </div>
  );
}
