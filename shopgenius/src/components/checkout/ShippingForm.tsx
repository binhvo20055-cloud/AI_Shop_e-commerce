"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CreditCard } from "lucide-react";

const schema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().default("US"),
});

type FormData = z.infer<typeof schema>;

interface ShippingFormProps {
  onSubmit: (data: FormData) => void;
  loading: boolean;
}

export function ShippingForm({ onSubmit, loading }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: "US" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-lg mb-5">Shipping Information</h2>

        <div className="space-y-4">
          {/* Address line 1 */}
          <div>
            <label htmlFor="line1" className="block text-sm font-medium mb-1">
              Street Address *
            </label>
            <input
              id="line1"
              {...register("line1")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
              placeholder="123 Main St"
            />
            {errors.line1 && (
              <p className="text-red-500 text-xs mt-1">{errors.line1.message}</p>
            )}
          </div>

          {/* Address line 2 */}
          <div>
            <label htmlFor="line2" className="block text-sm font-medium mb-1">
              Apartment, suite, etc.{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="line2"
              {...register("line2")}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
              placeholder="Apt 4B"
            />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                City *
              </label>
              <input
                id="city"
                {...register("city")}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
                placeholder="New York"
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-1">
                State *
              </label>
              <input
                id="state"
                {...register("state")}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
                placeholder="NY"
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          {/* Postal code + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                Postal Code *
              </label>
              <input
                id="postalCode"
                {...register("postalCode")}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
                placeholder="10001"
              />
              {errors.postalCode && (
                <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                Country
              </label>
              <select
                id="country"
                {...register("country")}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="VN">Vietnam</option>
                <option value="SG">Singapore</option>
                <option value="JP">Japan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Payment notice */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl border border-border text-sm text-muted-foreground">
        <CreditCard className="h-4 w-4 shrink-0 mt-0.5 text-brand-500" />
        <p>
          You&apos;ll be redirected to Stripe&apos;s secure checkout to complete payment.
          We accept all major cards, Apple Pay, Google Pay, and more.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-semibold text-base transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecting to Stripe...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Continue to Payment
          </>
        )}
      </button>
    </form>
  );
}
