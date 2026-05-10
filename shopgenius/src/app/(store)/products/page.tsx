import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductSort } from "@/components/product/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Products" };

interface ProductsPageProps {
  searchParams: {
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

const LIMIT = 16;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = createClient();
  const page = parseInt(searchParams.page ?? "1");
  const offset = (page - 1) * LIMIT;

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)", { count: "exact" })
    .eq("is_active", true)
    .range(offset, offset + LIMIT - 1);

  if (searchParams.category) query = query.eq("category_id", searchParams.category);
  if (searchParams.minPrice) query = query.gte("price", parseFloat(searchParams.minPrice));
  if (searchParams.maxPrice) query = query.lte("price", parseFloat(searchParams.maxPrice));

  switch (searchParams.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const [{ data: products, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name, slug").is("parent_id", null),
  ]);

  const totalPages = Math.ceil((count ?? 0) / LIMIT);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          All Products
          {count !== null && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({count} items)
            </span>
          )}
        </h1>
        <ProductSort current={searchParams.sort} />
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <ProductFilters
            categories={categories ?? []}
            currentCategory={searchParams.category}
            minPrice={searchParams.minPrice}
            maxPrice={searchParams.maxPrice}
          />
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {!products || products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/products"
                    searchParams={searchParams}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
