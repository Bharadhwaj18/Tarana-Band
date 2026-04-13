'use client';

import { useState } from 'react';
import ProductCarousel from './ProductCarousel';

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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => onAddToCart(product, selectedSize)}
              className="btn-primary block w-full text-center"
            >
              Add to Cart
            </button>
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
