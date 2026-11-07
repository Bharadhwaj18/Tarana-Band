'use client';

import { createContext, useContext } from 'react';
import { useConfigLoader, type FullConfig } from '@/lib/useConfigLoader';

const AppConfigContext = createContext<FullConfig | null>(null);

// Pages render straight away with default config and update once Supabase config
// arrives. Blocking on a loading screen hid all content from search engines.
export default function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const config = useConfigLoader();

  return <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used inside AppConfigProvider');
  }
  return context;
}
