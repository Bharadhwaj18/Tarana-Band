'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  image_urls?: string[] | null;
  image_positions?: string[] | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
}

export default function ProductCarousel({ product }: { product: Product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0
    ? product.image_urls.filter(url => url)
    : product.image_url
      ? [product.image_url]
      : [];

  if (images.length === 0) {
    return (
      <div className="relative w-full h-64 bg-gray-300 flex items-center justify-center">
        <p className="text-gray-500 text-sm">No image available</p>
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Auto-slide
  useEffect(() => {
    if (images.length <= 1 || isPaused || lightboxOpen) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length, isPaused, lightboxOpen]);

  // Keyboard navigation + Escape for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, currentImageIndex]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  return (
    <>
      {/* Card carousel */}
      <div
        className="relative w-full h-64 bg-gray-200 overflow-hidden group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <img
          src={images[currentImageIndex]}
          alt={product.name}
          onClick={() => setLightboxOpen(true)}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out cursor-zoom-in"
          style={{ objectPosition: product.image_positions?.[currentImageIndex] || 'center' }}
        />

        {/* Zoom hint */}
        <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zm3-8H8m3-3v6" />
          </svg>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 text-xs rounded">
              {currentImageIndex + 1} / {images.length}
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/25 rounded-full p-2 transition z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image — stop propagation so clicking it doesn't close */}
          <img
            src={images[currentImageIndex]}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-2xl select-none"
          />

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Hint */}
          <p className="absolute bottom-4 right-4 text-white/40 text-xs select-none">
            {images.length > 1 ? 'Click outside or press Esc / ← →' : 'Click outside or press Esc'}
          </p>
        </div>
      )}
    </>
  );
}
