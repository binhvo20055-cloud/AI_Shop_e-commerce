import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, store_name")
    .eq("user_id", user!.id)
    .single();

  const [{ count: productCount }, { count: orderCount }, { data: revenueData }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", merchant?.id ?? ""),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", merchant?.id ?? "")
        .eq("status", "confirmed"),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("merchant_id", merchant?.id ?? "")
        .eq("status", "confirmed"),
    ]);

  const totalRevenue = revenueData?.reduce((sum, o) => sum + o.total_amount, 0) ?? 0;
  const stats = [
    { label: "Total Products", value: productCount ?? 0, icon: Package, color: "text-blue-500" },
    { label: "Total Orders", value: orderCount ?? 0, icon: ShoppingBag, color: "text-green-500" },
    { label: "Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-brand-500" },
    { label: "Avg Order Value", value: orderCount ? formatPrice(totalRevenue / orderCount) : "$0", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{merchant?.store_name ? `, ${merchant.store_name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-6 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/dashboard/products/new"
          className="p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
        >
          <Package className="h-6 w-6 text-brand-500 mb-3" />
          <h3 className="font-semibold">Add New Product</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload images and let AI process them automatically.
          </p>
        </a>
        <a
          href="/dashboard/orders"
          className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <ShoppingBag className="h-6 w-6 text-green-500 mb-3" />
          <h3 className="font-semibold">View Orders</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and fulfill your customer orders.
          </p>
        </a>
      </div>
    </div>
  );
}
