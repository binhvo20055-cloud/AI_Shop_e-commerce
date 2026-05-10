import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, MapPin, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Details" };

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!order) notFound();

  const items = order.items as Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;

  const address = order.shipping_address as {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium capitalize",
            STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
          )}
        >
          {order.status}
        </span>
      </div>

      {/* Progress tracker */}
      {!["cancelled", "refunded"].includes(order.status) && (
        <div className="mb-8 p-4 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-border" aria-hidden="true" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-brand-500 transition-all"
              style={{
                width: `${currentStep >= 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0}%`,
              }}
              aria-hidden="true"
            />
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                    i <= currentStep
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                <span className="text-xs capitalize text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Order Items</h2>
          </div>
          <div className="divide-y divide-border">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-sm">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-border bg-muted/30">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-600 dark:text-brand-400">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Shipping Address</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{address.line1}</p>
            {address.line2 && <p>{address.line2}</p>}
            <p>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p>{address.country}</p>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Payment</h2>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Placed: {formatDate(order.created_at!)}</p>
            {order.stripe_payment_intent_id && (
              <p className="font-mono text-xs">
                Ref: {order.stripe_payment_intent_id.slice(-8).toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
