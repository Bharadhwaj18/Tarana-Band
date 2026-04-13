'use client';

import { createContext, useContext } from 'react';
import { useConfigLoader, type FullConfig } from '@/lib/useConfigLoader';

const AppConfigContext = createContext<FullConfig | null>(null);

function AppLoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <img src="/favicon.ico" alt="Tarana logo" className="h-20 w-20 object-contain" />
      <p className="text-gold text-lg font-semibold tracking-wide">Loading TARANA...</p>
      <div className="h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
    </div>
  );
}

export default function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const config = useConfigLoader();

  if (!config.isLoaded) {
    return <AppLoadingScreen />;
  }

  return <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used inside AppConfigProvider');
  }
  return context;
}
