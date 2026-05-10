import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import {
  Package, ShoppingBag, DollarSign, TrendingUp,
  Clock, CheckCircle, Truck, Star,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) redirect("/dashboard/onboarding");

  // Use RPC for aggregated stats
  const { data: stats } = await (supabase as any)
    .rpc("get_merchant_stats", { p_merchant_id: merchant.id })
    .single();

  // Recent orders breakdown
  const { data: ordersByStatus } = await supabase
    .from("orders")
    .select("status")
    .eq("merchant_id", merchant.id);

  const statusCounts = ((ordersByStatus ?? []) as Array<{status: string}>).reduce<Record<string, number>>(
    (acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }),
    {}
  );

  // Top products by order count
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("items, total_amount, created_at")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const kpis = [
    {
      label: "Total Products",
      value: (stats as any)?.total_products ?? 0,
      sub: `${(stats as any)?.active_products ?? 0} active`,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Total Orders",
      value: (stats as any)?.total_orders ?? 0,
      sub: `${statusCounts.pending ?? 0} pending`,
      icon: ShoppingBag,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Total Revenue",
      value: formatPrice(Number((stats as any)?.total_revenue ?? 0)),
      sub: "confirmed + shipped + delivered",
      icon: DollarSign,
      color: "text-brand-500",
      bg: "bg-brand-50 dark:bg-brand-900/20",
    },
    {
      label: "Avg Order Value",
      value: formatPrice(Number((stats as any)?.avg_order_value ?? 0)),
      sub: "across all orders",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const orderStatusCards = [
    { label: "Pending", count: statusCounts.pending ?? 0, icon: Clock, color: "text-yellow-500" },
    { label: "Confirmed", count: statusCounts.confirmed ?? 0, icon: CheckCircle, color: "text-blue-500" },
    { label: "Shipped", count: statusCounts.shipped ?? 0, icon: Truck, color: "text-purple-500" },
    { label: "Delivered", count: statusCounts.delivered ?? 0, icon: Star, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Overview of your store performance.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="p-6 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Order Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {orderStatusCards.map(({ label, count, icon: Icon, color }) => (
            <div
              key={label}
              className="p-4 bg-card border border-border rounded-2xl text-center"
            >
              <Icon className={`mx-auto h-6 w-6 ${color} mb-2`} aria-hidden="true" />
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent revenue */}
      {recentOrders && recentOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Orders (Last 30)</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Items</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order, i) => {
                  const items = order.items as Array<{ productName: string; quantity: number }>;
                  return (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.created_at!).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {items.length === 1
                          ? `${items[0].productName} ×${items[0].quantity}`
                          : `${items.length} items`}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatPrice(order.total_amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
