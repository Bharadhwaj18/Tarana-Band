'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { RiglyItem } from '@/lib/rigly';

/** Rigly's items, sizes and stock for admin pages (needs the admin to be signed in). */
export function useRiglyItems() {
  const [items, setItems] = useState<RiglyItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    try {
      const res = await fetch('/api/admin/rigly-items', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Could not load Rigly stock.');
      setItems(Array.isArray(body.items) ? body.items : []);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Could not load Rigly stock.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, error, loading, reload: load };
}
