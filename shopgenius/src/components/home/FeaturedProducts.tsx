import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";

export async function FeaturedProducts() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products yet. Be the first to{" "}
        <a href="/dashboard/products/new" className="text-brand-500 hover:underline">
          add a product
        </a>
        !
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product as any} />
      ))}
    </div>
  );
}
