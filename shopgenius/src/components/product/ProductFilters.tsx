"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  currentCategory?: string;
  minPrice?: string;
  maxPrice?: string;
}

export function ProductFilters({
  categories,
  currentCategory,
  minPrice,
  maxPrice,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset to page 1
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  const hasFilters = currentCategory || minPrice || maxPrice;

  return (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-brand-500 hover:underline"
        >
          Clear all filters
        </button>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter("category", null)}
            className={cn(
              "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
              !currentCategory
                ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter("category", cat.id)}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                currentCategory === cat.id
                  ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={minPrice}
              min={0}
              onBlur={(e) => updateFilter("minPrice", e.target.value || null)}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Minimum price"
            />
            <span className="text-muted-foreground text-sm">–</span>
            <input
              type="number"
              placeholder="Max"
              defaultValue={maxPrice}
              min={0}
              onBlur={(e) => updateFilter("maxPrice", e.target.value || null)}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Maximum price"
            />
          </div>
          {/* Quick price presets */}
          {[
            { label: "Under $25", max: "25" },
            { label: "$25 – $50", min: "25", max: "50" },
            { label: "$50 – $100", min: "50", max: "100" },
            { label: "Over $100", min: "100" },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (preset.min) params.set("minPrice", preset.min);
                else params.delete("minPrice");
                if (preset.max) params.set("maxPrice", preset.max);
                else params.delete("maxPrice");
                params.delete("page");
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
