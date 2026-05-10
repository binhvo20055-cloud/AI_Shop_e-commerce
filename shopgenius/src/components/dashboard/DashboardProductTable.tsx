"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit2, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories: { name: string } | null;
};

interface DashboardProductTableProps {
  products: Product[];
}

export function DashboardProductTable({ products: initialProducts }: DashboardProductTableProps) {
  const [products, setProducts] = useState(initialProducts);

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });

    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !current } : p))
      );
      toast.success(current ? "Product hidden" : "Product published");
    } else {
      toast.error("Failed to update product");
    }
  };

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });

    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } else {
      toast.error("Failed to delete product");
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl">
        <p className="text-muted-foreground mb-4">No products yet</p>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Your First Product
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Stock</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                {/* Product */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                      {(product.processed_images[0] ?? product.images[0]) && (
                        <Image
                          src={product.processed_images[0] ?? product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3 text-muted-foreground">
                  {product.categories?.name ?? "—"}
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-right font-medium">
                  {formatPrice(product.price)}
                </td>

                {/* Stock */}
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "font-medium",
                      product.stock === 0
                        ? "text-red-500"
                        : product.stock <= 5
                        ? "text-orange-500"
                        : "text-green-600"
                    )}
                  >
                    {product.stock}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      product.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    )}
                  >
                    {product.is_active ? "Active" : "Draft"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleActive(product.id, product.is_active)}
                      aria-label={product.is_active ? "Hide product" : "Publish product"}
                      title={product.is_active ? "Hide" : "Publish"}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {product.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      aria-label="Edit product"
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id, product.name)}
                      aria-label="Delete product"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
