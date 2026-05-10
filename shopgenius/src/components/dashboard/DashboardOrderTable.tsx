"use client";

import { useState } from "react";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_OPTIONS = ["confirmed", "shipped", "delivered", "cancelled"] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface DashboardOrderTableProps {
  orders: Order[];
}

export function DashboardOrderTable({ orders: initialOrders }: DashboardOrderTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [updating, setUpdating] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed");

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Order marked as ${status}`);
    } catch {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground">
        No orders yet. Share your store to start selling!
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order ID</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Items</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => {
              const items = order.items as Array<{ productName: string; quantity: number }>;
              return (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(order.created_at!)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {items.length === 1
                      ? `${items[0].productName} ×${items[0].quantity}`
                      : `${items.length} items`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatPrice(order.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                        STATUS_STYLES[order.status] ?? STATUS_STYLES.pending
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={order.status}
                      disabled={
                        updating === order.id ||
                        order.status === "delivered" ||
                        order.status === "refunded"
                      }
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      aria-label={`Update status for order ${order.id.slice(0, 8)}`}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 cursor-pointer"
                    >
                      <option value={order.status} disabled>
                        {order.status}
                      </option>
                      {STATUS_OPTIONS.filter((s) => s !== order.status).map((s) => (
                        <option key={s} value={s}>
                          → {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
