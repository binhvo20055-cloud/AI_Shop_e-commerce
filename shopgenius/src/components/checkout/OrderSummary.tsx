import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
}

export function OrderSummary({ items, total }: OrderSummaryProps) {
  const shipping = total > 50 ? 0 : 5.99;
  const tax = total * 0.08;
  const grandTotal = total + shipping + tax;

  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-6 sticky top-24">
      <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

      {/* Items */}
      <div className="space-y-3 mb-6">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={product.processedImages?.[0] ?? product.images?.[0] ?? "/placeholder-product.png"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
            </div>
            <span className="text-sm font-medium shrink-0">
              {formatPrice(product.price * quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (8%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
          <span>Total</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {total < 50 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Add {formatPrice(50 - total)} more for free shipping!
        </p>
      )}
    </div>
  );
}
