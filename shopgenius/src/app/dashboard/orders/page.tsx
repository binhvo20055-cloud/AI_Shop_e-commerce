import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardOrderTable } from "@/components/dashboard/DashboardOrderTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders" };

export default async function DashboardOrdersPage() {
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

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          {orders?.length ?? 0} total orders
        </p>
      </div>
      <DashboardOrderTable orders={orders ?? []} />
    </div>
  );
}
