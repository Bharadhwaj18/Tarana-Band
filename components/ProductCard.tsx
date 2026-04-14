'use client';

import { useState } from 'react';
import ProductCarousel from './ProductCarousel';

interface SizeStock {
  [size: string]: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  image_urls?: string[] | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
  size_stock?: SizeStock | null;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, size: string) => void;
}

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const descriptionLimit = 150; // Character limit for preview

  const shouldShowToggle = product.description.length > descriptionLimit;
  const displayDescription = isExpanded
    ? product.description
    : product.description.slice(0, descriptionLimit) + (shouldShowToggle ? '...' : '');

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <ProductCarousel product={product} />
      <div className="p-6">
        <h3 className="heading-md mb-2">{product.name}</h3>
        <p className="text-red-600 font-bold text-lg mb-3">
          ₹{product.price.toFixed(2)}
        </p>
        <p className="text-gray-600 mb-2">{displayDescription}</p>
        {shouldShowToggle && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-red-600 hover:text-red-700 text-sm font-semibold mb-4"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
        {onAddToCart ? (
          <div className="mt-4 space-y-3">
            {(() => {
              const stock = product.size_stock;
              const hasStock = stock && Object.keys(stock).length > 0;

              // No size_stock configured → no sizes needed (non-clothing item)
              if (!hasStock) {
                return (
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, 'One Size')}
                    className="btn-primary block w-full text-center"
                  >
                    Add to Cart
                  </button>
                );
              }

              // Has stock config → filter to sizes with quantity > 0
              const availableSizes = SIZE_OPTIONS.filter((s) => (stock[s] ?? 0) > 0);

              if (availableSizes.length === 0) {
                return (
                  <div className="bg-gray-200 text-gray-500 font-bold text-center py-3 rounded-lg uppercase tracking-wide">
                    Sold Out
                  </div>
                );
              }

              const effectiveSize = availableSizes.includes(selectedSize)
                ? selectedSize
                : availableSizes[0];

              return (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Size</label>
                    <div className="flex gap-2 flex-wrap">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                            effectiveSize === size
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, effectiveSize)}
                    className="btn-primary block w-full text-center"
                  >
                    Add to Cart
                  </button>
                </>
              );
            })()}
          </div>
        ) : (
          <a
            href={product.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary block text-center mt-4"
          >
            Buy Now
          </a>
        )}
      </div>
    </div>
  );
}
