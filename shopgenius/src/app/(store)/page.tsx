import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { VoiceSearchBar } from "@/components/search/VoiceSearchBar";

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      {/* AI Voice Search */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <VoiceSearchBar />
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-xl" />}>
          <CategoryGrid />
        </Suspense>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-8">Featured Products</h2>
        <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
          <FeaturedProducts />
        </Suspense>
      </section>
    </main>
  );
}
