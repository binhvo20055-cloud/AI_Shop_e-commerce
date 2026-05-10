"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types";

interface ProductInfoProps {
  product: Product & { categories?: { name: string; slug: string } | null };
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-4">
      {/* Category */}
      {product.categories && (
        <a
          href={`/categories/${product.categories.slug}`}
          className="text-sm text-brand-500 hover:underline"
        >
          {product.categories.name}
        </a>
      )}

      {/* Name */}
      <h1 className="text-3xl font-bold">{product.name}</h1>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {formatPrice(product.price)}
        </span>
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-medium rounded-lg">
              -{Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
            </span>
          </>
        )}
      </div>

      {/* Description */}
      <p className="text-muted-foreground leading-relaxed">{product.description}</p>

      {/* Stock */}
      <div className="text-sm">
        {product.stock > 10 ? (
          <span className="text-green-600">✓ In stock</span>
        ) : product.stock > 0 ? (
          <span className="text-orange-500">⚠ Only {product.stock} left</span>
        ) : (
          <span className="text-red-500">✗ Out of stock</span>
        )}
      </div>

      {/* Quantity selector */}
      {product.stock > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="p-3 hover:bg-muted transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              aria-label="Increase quantity"
              className="p-3 hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
