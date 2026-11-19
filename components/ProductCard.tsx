'use client';

import { useState } from 'react';
import ProductCarousel from './ProductCarousel';

export interface SizeStock {
  [size: string]: number;
}

export interface Product {
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
  size_stock?: SizeStock | null;
}

export const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];
export const ONE_SIZE = 'One Size';
const LOW_STOCK = 3;

/** How many of a size are left, or null when the product doesn't track sizes */
export function stockFor(product: Product, size: string): number | null {
  const stock = product.size_stock;
  if (!stock || Object.keys(stock).length === 0) return null;
  return stock[size] ?? 0;
}

interface ProductCardProps {
  product: Product;
  index: number;
  /** How many of each size are already in the bag, keyed by size */
  inBag?: Record<string, number>;
  onAddToCart?: (product: Product, size: string) => void;
}

export default function ProductCard({ product, index, inBag = {}, onAddToCart }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stock = product.size_stock;
  const tracksSizes = !!stock && Object.keys(stock).length > 0;
  const availableSizes = tracksSizes ? SIZE_OPTIONS.filter((s) => (stock![s] ?? 0) > 0) : [];
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const soldOut = tracksSizes && availableSizes.length === 0;
  const lowStock = tracksSizes && availableSizes.some((s) => (stock![s] ?? 0) <= LOW_STOCK);
  const effectiveSize = tracksSizes
    ? selectedSize && availableSizes.includes(selectedSize)
      ? selectedSize
      : null
    : ONE_SIZE;
  const left = effectiveSize && tracksSizes ? stock![effectiveSize] ?? 0 : null;
  const alreadyInBag = effectiveSize ? inBag[effectiveSize] || 0 : 0;
  const reachedLimit = left !== null && alreadyInBag >= left;

  const shouldShowToggle = product.description.length > 160;

  let buttonLabel = 'Add to bag →';
  let disabledReason = '';
  if (soldOut) {
    buttonLabel = 'Sold out';
    disabledReason = 'Every size is sold out right now.';
  } else if (!effectiveSize) {
    buttonLabel = 'Pick a size first';
    disabledReason = 'Choose a size above to add this tee to your bag.';
  } else if (reachedLimit) {
    buttonLabel = 'All in your bag';
    disabledReason = `You have all ${left} of size ${effectiveSize} in your bag.`;
  }
  const canAdd = !!onAddToCart && !disabledReason;
  const reasonId = `reason-${product.id}`;

  return (
    <article className="border-[3px] border-ink bg-white flex flex-col">
      <div className="flex justify-between px-4 py-3 border-b-[3px] border-ink gp-mono text-[13px] font-bold uppercase">
        <span>No. {String(index + 1).padStart(2, '0')}</span>
        {soldOut ? (
          <span>Sold out</span>
        ) : lowStock ? (
          <span className="text-poster-dark">Selling fast</span>
        ) : null}
      </div>

      <ProductCarousel product={product} />

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex justify-between items-baseline gap-3">
          <h2 className="font-poster uppercase text-3xl sm:text-[40px] leading-[0.95] tracking-tight">{product.name}</h2>
          <span className="gp-mono text-xl sm:text-[22px] font-bold whitespace-nowrap">₹{product.price.toFixed(0)}</span>
        </div>

        <div className={`relative overflow-hidden mt-3 ${isExpanded ? '' : 'max-h-[4.9rem]'}`}>
          <p className="text-base leading-relaxed">{product.description}</p>
          {!isExpanded && shouldShowToggle && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
        {shouldShowToggle && (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
            className="self-start gp-mono text-[13px] font-bold mt-1 py-2 underline underline-offset-4"
          >
            {isExpanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        )}

        {onAddToCart ? (
          <div className="mt-4 flex flex-col flex-1">
            {tracksSizes && (
              <fieldset>
                <legend className="gp-mono text-[13px] uppercase mb-2">Size</legend>
                <div className="grid grid-cols-5 border-2 border-ink">
                  {SIZE_OPTIONS.map((size, i) => {
                    const sizeLeft = stock![size] ?? 0;
                    const isOut = sizeLeft <= 0;
                    const isSelected = effectiveSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isOut}
                        aria-pressed={isSelected}
                        aria-label={isOut ? `${size}, sold out` : size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-h-[52px] gp-mono font-bold ${i < SIZE_OPTIONS.length - 1 ? 'border-r-2 border-ink' : ''} ${
                          isOut
                            ? 'line-through text-muted bg-[repeating-linear-gradient(135deg,#F1ECE2_0_6px,#E2DCD0_6px_12px)] cursor-not-allowed'
                            : isSelected
                              ? 'bg-ink text-paper'
                              : 'bg-white hover:bg-paper'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <p className="gp-mono text-[13px] mt-2.5 min-h-[20px]">
                  {left !== null && left <= LOW_STOCK ? (
                    <span className="font-bold text-poster-dark">
                      Only {left} left in {effectiveSize}
                    </span>
                  ) : effectiveSize ? (
                    `Size ${effectiveSize} selected`
                  ) : !soldOut ? (
                    'Pick a size to add it to your bag'
                  ) : null}
                </p>
              </fieldset>
            )}

            <div className="mt-auto pt-5">
              <button
                type="button"
                disabled={!canAdd}
                aria-describedby={disabledReason ? reasonId : undefined}
                onClick={() => effectiveSize && onAddToCart(product, effectiveSize)}
                className={`w-full min-h-[58px] text-[17px] font-bold uppercase tracking-wide gp-btn ${
                  canAdd ? 'gp-btn-red' : 'border-[3px] border-ink bg-white text-ink'
                }`}
              >
                {buttonLabel}
              </button>
              {disabledReason && (
                <p id={reasonId} className="gp-mono text-xs mt-2.5">
                  {disabledReason}
                </p>
              )}
            </div>
          </div>
        ) : (
          <a
            href={product.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="gp-btn gp-btn-red mt-5 w-full"
          >
            Buy now ↗
          </a>
        )}
      </div>
    </article>
  );
}
