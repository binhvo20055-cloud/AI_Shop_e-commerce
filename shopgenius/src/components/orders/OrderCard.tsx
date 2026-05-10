import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import { Package, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const items = order.items as Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }>;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="text-sm font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Placed</p>
            <p className="text-sm">{formatDate(order.created_at!)}</p>
          </div>
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
              STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
            )}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-5 py-4 space-y-2">
        {items.slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {item.productName}{" "}
              <span className="text-foreground font-medium">×{item.quantity}</span>
            </span>
            <span className="font-medium">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
        {items.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{items.length - 3} more items
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-border">
        <div>
          <span className="text-sm text-muted-foreground">Total: </span>
          <span className="font-bold text-brand-600 dark:text-brand-400">
            {formatPrice(order.total_amount)}
          </span>
        </div>
        <Link
          href={`/orders/${order.id}`}
          className="flex items-center gap-1 text-sm text-brand-500 hover:underline"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
