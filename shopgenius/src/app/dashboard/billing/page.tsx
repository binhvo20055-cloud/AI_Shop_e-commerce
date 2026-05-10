import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { formatDate, formatPrice } from "@/lib/utils";
import { CheckCircle, AlertCircle, CreditCard, ExternalLink, Zap } from "lucide-react";
import { UpgradePlanButton } from "@/components/dashboard/UpgradePlanButton";
import { ManageBillingButton } from "@/components/dashboard/ManageBillingButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Up to 10 products",
      "Basic analytics",
      "Standard support",
      "Supabase storage",
    ],
    cta: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "For growing businesses",
    features: [
      "Unlimited products",
      "AI image processing (Bria AI)",
      "Audio descriptions (ElevenLabs)",
      "Advanced analytics",
      "Priority support",
      "14-day free trial",
    ],
    cta: "Upgrade to Pro",
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For large-scale operations",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "Custom AI models",
    ],
    cta: "Contact Sales",
  },
] as const;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!merchant) redirect("/dashboard/onboarding");

  // Fetch invoices from Stripe if customer exists
  let invoices: Array<{
    id: string;
    created: number;
    amount_paid: number;
    currency: string;
    status: string | null;
    invoice_pdf: string | null;
    hosted_invoice_url: string | null;
  }> = [];

  if ((merchant as any).stripe_customer_id) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: (merchant as any).stripe_customer_id,
        limit: 10,
      });
      invoices = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        created: inv.created,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status as string | null,
        invoice_pdf: inv.invoice_pdf ?? null,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
      }));
    } catch {
      // Stripe not configured yet — skip
    }
  }

  const currentPlan = (merchant as any).plan ?? "starter";
  const subStatus = (merchant as any).subscription_status;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your plan, payment methods, and invoices.
        </p>
      </div>

      {/* Upgrade success banner */}
      {searchParams.upgraded && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            🎉 Plan upgraded successfully! Your new features are now active.
          </p>
        </div>
      )}

      {/* Current plan status */}
      <div className="p-5 bg-card border border-border rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {subStatus === "active" || subStatus === "trialing" ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
          )}
          <div>
            <p className="font-semibold capitalize">
              {currentPlan} Plan
              {subStatus === "trialing" && (
                <span className="ml-2 text-xs bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full">
                  Trial
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {subStatus ?? "Free tier"}
            </p>
          </div>
        </div>

        {/* Manage billing portal */}
        {(merchant as any).stripe_customer_id && (
          <ManageBillingButton />
        )}
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isRecommended = "recommended" in plan && plan.recommended;

            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  isCurrent
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : isRecommended
                    ? "border-brand-300 dark:border-brand-700"
                    : "border-border"
                }`}
              >
                {isRecommended && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                      <Zap className="h-3 w-3" />
                      Recommended
                    </span>
                  </div>
                )}

                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">{plan.description}</p>

                <div className="mb-4">
                  {plan.price === null ? (
                    <span className="text-2xl font-bold">Custom</span>
                  ) : plan.price === 0 ? (
                    <span className="text-2xl font-bold">Free</span>
                  ) : (
                    <span className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center text-sm font-medium text-brand-600 dark:text-brand-400 py-2">
                    ✓ Current Plan
                  </div>
                ) : plan.cta ? (
                  <UpgradePlanButton
                    plan={plan.id as "pro" | "enterprise"}
                    label={plan.cta}
                    recommended={isRecommended}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Invoice History
          </h2>
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(new Date(inv.created * 1000))}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: inv.currency.toUpperCase(),
                      }).format(inv.amount_paid / 100)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.invoice_pdf && (
                          <a
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:underline text-xs flex items-center gap-1"
                          >
                            PDF
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {inv.hosted_invoice_url && (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:underline text-xs flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
