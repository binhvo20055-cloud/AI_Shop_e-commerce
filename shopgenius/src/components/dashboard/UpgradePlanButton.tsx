"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UpgradePlanButtonProps {
  plan: "pro" | "enterprise";
  label: string;
  recommended?: boolean;
}

export function UpgradePlanButton({ plan, label, recommended }: UpgradePlanButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (plan === "enterprise") {
      window.open("mailto:sales@shopgenius.com?subject=Enterprise Plan Inquiry", "_blank");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start upgrade");
      }

      // Redirect to Stripe Checkout for subscription
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upgrade failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50",
        recommended
          ? "bg-brand-500 hover:bg-brand-600 text-white"
          : "border border-border hover:bg-muted"
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      {loading ? "Redirecting..." : label}
    </button>
  );
}
