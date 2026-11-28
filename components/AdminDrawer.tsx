'use client';

import { useEffect, useRef } from 'react';

interface AdminDrawerProps {
  open: boolean;
  title: string;
  /** Called when the person closes the panel (X, Esc or clicking outside). The page decides whether to ask first. */
  onClose: () => void;
  /** Wider panel, for forms with side-by-side fields such as photo slots */
  wide?: boolean;
  children: React.ReactNode;
}

/**
 * A panel that slides in from the right over the page, used for add/edit forms in admin.
 * The list stays where it was behind it, so there is no scrolling up to a form and back down again.
 * Save/Cancel go in <DrawerFooter>, which stays pinned to the bottom while the form scrolls.
 */
export default function AdminDrawer({ open, title, onClose, wide, children }: AdminDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Esc closes; the page behind stops scrolling while the panel is open
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Start in the first field so the person can type straight away
    const firstField = panelRef.current?.querySelector<HTMLElement>('input:not([type="file"]):not([type="hidden"]), textarea, select');
    firstField?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 admin-drawer-fade" onClick={() => onCloseRef.current()} />
      <div
        ref={panelRef}
        className={`admin-drawer-slide relative flex flex-col w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} h-full bg-gray-800 border-l border-gray-700 shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-700 shrink-0">
          <h2 className="text-xl font-semibold text-gold">{title}</h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close"
            className="text-gray-400 hover:text-white text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-0">{children}</div>
      </div>
    </div>
  );
}

/** Save/Cancel row for the bottom of a drawer form: stays visible however long the form is */
export function DrawerFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-4 bg-gray-800 border-t border-gray-700 flex gap-2">{children}</div>
  );
}
