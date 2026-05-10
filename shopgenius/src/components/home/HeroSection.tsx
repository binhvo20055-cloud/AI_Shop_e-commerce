import Link from "next/link";
import { Sparkles, Mic, ShoppingBag } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-200/30 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Shopping Experience
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
          Shop Smarter with{" "}
          <span className="text-brand-500">AI</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
          Voice search, AI-processed product images, and audio descriptions — the future of e-commerce is here.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            Start Shopping
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-border hover:bg-muted rounded-xl font-medium transition-colors"
          >
            <Mic className="h-5 w-5 text-brand-500" />
            Try Voice Search
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {[
            "🎙️ Voice Search",
            "🖼️ AI Image Processing",
            "🔊 Audio Descriptions",
            "⚡ Real-time Stock",
            "💳 Secure Checkout",
          ].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 bg-white/70 dark:bg-gray-800/70 border border-border rounded-full text-sm text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
