import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductAudioPlayer } from "@/components/product/ProductAudioPlayer";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ReviewSection } from "@/components/product/ReviewSection";

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", params.id)
    .single();

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name, slug), merchants(store_name, store_slug)")
    .eq("id", params.id)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

  // Cast to any to bridge Supabase row type and app Product type
  const p = product as any;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Image Gallery */}
        <ProductGallery
          images={p.processed_images.length > 0 ? p.processed_images : p.images}
          productName={p.name}
        />

        {/* Right: Product Info */}
        <div className="space-y-6">
          <ProductInfo product={p} />

          {/* AI Audio Description */}
          {(p.audio_description_url || p.description) && (
            <ProductAudioPlayer
              audioUrl={p.audio_description_url ?? undefined}
              description={p.description}
              productName={p.name}
            />
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={p.id} />

      {/* Related Products */}
      <RelatedProducts
        categoryId={p.category_id}
        currentProductId={p.id}
      />
    </div>
  );
}
