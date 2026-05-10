"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface CheckoutFormProps {
  onPaymentIntentCreated?: (clientSecret: string) => void;
}

export function CheckoutForm({ onPaymentIntentCreated }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"address" | "payment">("address");

  const [address, setAddress] = useState({
    name: "",
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
          })),
        }),
      });

      const { clientSecret } = await res.json();
      onPaymentIntentCreated?.(clientSecret);
      setStep("payment");
    } catch {
      toast.error("Failed to initialize payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: { name: address.name },
        },
      },
    });

    if (error) {
      toast.error(error.message ?? "Payment failed.");
      setLoading(false);
    } else {
      clearCart();
    }
  };

  if (step === "address") {
    return (
      <form onSubmit={handleAddressSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Shipping Information</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
          <input
            id="name"
            value={address.name}
            onChange={(e) => setAddress({ ...address, name: e.target.value })}
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="line1" className="block text-sm font-medium mb-1">Address</label>
          <input
            id="line1"
            value={address.line1}
            onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
            <input
              id="city"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Postal Code</label>
            <input
              id="postalCode"
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          Continue to Payment
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold">Payment Details</h2>
      <PaymentElement />
      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Pay {/* total shown in OrderSummary */}
      </button>
    </form>
  );
}
