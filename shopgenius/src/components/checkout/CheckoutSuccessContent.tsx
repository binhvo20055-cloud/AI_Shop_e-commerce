"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Loader2, XCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface SessionDetails {
  customerEmail: string | null;
  amountTotal: number;
  currency: string;
  paymentStatus: string;
}

interface CheckoutSuccessContentProps {
  sessionId?: string;
}

export function CheckoutSuccessContent({ sessionId }: CheckoutSuccessContentProps) {
  const clearCart = useCartStore((s) => s.clearCart);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearCart();

    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/stripe/session?id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSession(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-500 mb-4" />
        <p className="text-muted-foreground">Confirming your order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg">
        <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Link href="/orders" className="text-brand-500 hover:underline">
          Check your orders
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-lg">
      {/* Success icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-3">Order Confirmed! 🎉</h1>

      {session?.customerEmail && (
        <p className="text-muted-foreground mb-2">
          Confirmation sent to{" "}
          <span className="font-medium text-foreground">{session.customerEmail}</span>
        </p>
      )}

      {session?.amountTotal && (
        <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-6">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: session.currency.toUpperCase(),
          }).format(session.amountTotal / 100)}
        </p>
      )}

      <p className="text-muted-foreground mb-8">
        Thank you for your purchase. Your order is being processed and you&apos;ll
        receive updates via email.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/orders"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
        >
          <Package className="h-4 w-4" />
          View My Orders
        </Link>
        <Link
          href="/products"
          className="flex items-center justify-center gap-2 px-6 py-3 border border-border hover:bg-muted rounded-xl font-medium transition-colors"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
