'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  image_urls?: string[] | null;
  image_positions?: string[] | null;
}

export default function ProductCarousel({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls.filter(Boolean)
      : product.image_url
        ? [product.image_url]
        : [];
  const count = images.length;

  const prev = () => setIndex((i) => (i === 0 ? count - 1 : i - 1));
  const next = () => setIndex((i) => (i === count - 1 ? 0 : i + 1));

  // Auto-advance every 5 seconds unless hovered or zoomed
  useEffect(() => {
    if (count <= 1 || isPaused || lightboxOpen) return;
    const timer = setInterval(() => setIndex((i) => (i === count - 1 ? 0 : i + 1)), 5000);
    return () => clearInterval(timer);
  }, [count, isPaused, lightboxOpen]);

  // Lightbox keyboard controls and scroll lock
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setIndex((i) => (i === 0 ? count - 1 : i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => (i === count - 1 ? 0 : i + 1));
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, count]);

  if (count === 0) {
    return (
      <div className="w-full aspect-square bg-rule flex items-center justify-center border-b-[3px] border-ink">
        <p className="gp-mono text-sm">Photo coming soon</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="relative border-b-[3px] border-ink bg-ink overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={`Zoom photo ${index + 1} of ${product.name}`}
          className="block w-full p-0 cursor-zoom-in"
        >
          <img
            src={images[index]}
            alt={`${product.name}, photo ${index + 1} of ${count}`}
            className="w-full aspect-square object-cover block"
            style={{ objectPosition: product.image_positions?.[index] || 'center' }}
          />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 border-[3px] border-ink bg-paper font-bold text-lg hover:bg-white"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-ink text-paper font-bold text-lg hover:bg-poster"
            >
              →
            </button>
            <span className="absolute right-0 bottom-0 bg-ink text-paper gp-mono text-xs font-bold px-2.5 py-1.5">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-ink/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} photos`}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 gp-btn gp-btn-paper min-h-[44px] px-4 gp-mono text-sm uppercase"
          >
            Close ✕
          </button>
          <img
            src={images[index]}
            alt={`${product.name}, photo ${index + 1} of ${count}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] object-contain border-[3px] border-paper select-none"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-paper text-ink font-bold text-xl"
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-poster text-white font-bold text-xl"
              >
                →
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-paper text-ink gp-mono text-sm font-bold px-4 py-1.5">
                {index + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
