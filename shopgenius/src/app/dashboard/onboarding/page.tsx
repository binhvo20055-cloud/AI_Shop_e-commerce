"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Store created! Welcome to ShopGenius.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Store className="h-8 w-8 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Set up your store</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          You&apos;re one step away from selling on ShopGenius.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium mb-1">
              Store Name *
            </label>
            <input
              id="storeName"
              {...register("storeName")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Nguyen's Tech Shop"
            />
            {errors.storeName && (
              <p className="text-red-500 text-xs mt-1">{errors.storeName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Tell customers what you sell..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Create My Store
          </button>
        </form>
      </div>
    </div>
  );
}
