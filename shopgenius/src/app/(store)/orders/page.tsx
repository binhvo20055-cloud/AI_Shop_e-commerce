import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderCard } from "@/components/orders/OrderCard";
import { Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">My Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg mb-4">No orders yet</p>
          <a
            href="/products"
            className="text-brand-500 hover:underline"
          >
            Start shopping
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={(order as any).id} order={order as any} />
          ))}
        </div>
      )}
    </div>
  );
}
