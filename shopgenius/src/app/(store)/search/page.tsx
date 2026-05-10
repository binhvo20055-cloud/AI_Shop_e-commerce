import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSort } from "@/components/product/ProductSort";
import { Pagination } from "@/components/ui/Pagination";
import { VoiceSearchBar } from "@/components/search/VoiceSearchBar";
import { Search } from "lucide-react";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: { q?: string; sort?: string; page?: string };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  return {
    title: searchParams.q ? `"${searchParams.q}" — Search` : "Search Products",
  };
}

const LIMIT = 16;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q?.trim();
  const page = parseInt(searchParams.page ?? "1");
  const offset = (page - 1) * LIMIT;

  if (!q) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-8">Search Products</h1>
        <VoiceSearchBar />
      </div>
    );
  }

  const supabase = createClient();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .textSearch("name", q, { type: "websearch", config: "english" })
    .range(offset, offset + LIMIT - 1);

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

  const { data: products, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / LIMIT);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <VoiceSearchBar initialQuery={q} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">
            {count ?? 0} results for{" "}
            <span className="text-brand-500">&ldquo;{q}&rdquo;</span>
          </h1>
        </div>
        <ProductSort current={searchParams.sort} />
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg mb-4">
            No products found for &ldquo;{q}&rdquo;
          </p>
          <a href="/products" className="text-brand-500 hover:underline">
            Browse all products
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/search"
                searchParams={searchParams}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
