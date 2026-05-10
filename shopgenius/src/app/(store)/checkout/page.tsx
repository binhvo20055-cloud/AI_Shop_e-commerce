"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <a href="/products" className="text-brand-500 hover:underline">
          Continue shopping
        </a>
      </div>
    );
  }

  const handleCheckout = async (shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => {
    setLoading(true);

    try {
      // Group items by merchant (simplified: use first item's merchant)
      // In production, split cart by merchant and create separate sessions
      const firstItem = items[0];

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.product.price,
            imageUrl:
              (i.product as any).processedImages?.[0] ??
              (i.product as any).processed_images?.[0] ??
              i.product.images?.[0],
          })),
          merchantId: (firstItem.product as any).merchant_id ?? (firstItem.product as any).merchantId,
          shippingAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }

      // Redirect to Stripe Checkout (hosted page)
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <div className="flex items-center gap-1 ml-auto text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Secured by Stripe
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-2">
          <ShippingForm onSubmit={handleCheckout} loading={loading} />
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <OrderSummary items={items} total={totalPrice()} />
        </div>
      </div>
    </div>
  );
}
