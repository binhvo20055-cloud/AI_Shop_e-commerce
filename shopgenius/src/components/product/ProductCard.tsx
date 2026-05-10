"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Volume2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const displayImage =
    product.processedImages?.[0] ?? product.images?.[0] ?? "/placeholder-product.png";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Audio badge */}
        {product.audioDescriptionUrl && (
          <div className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-lg">
            <Volume2 className="h-3.5 w-3.5 text-brand-500" aria-label="Has audio description" />
          </div>
        )}

        {/* Discount badge */}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-lg">
            -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>

        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-bold text-brand-600 dark:text-brand-400">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="ml-2 text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>

        {/* Stock indicator */}
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-orange-500 mt-2">Only {product.stock} left!</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-2">Out of stock</p>
        )}
      </div>
    </Link>
  );
}
