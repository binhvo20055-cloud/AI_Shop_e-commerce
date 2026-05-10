import { Suspense } from "react";
import { CheckoutSuccessContent } from "@/components/checkout/CheckoutSuccessContent";

export const metadata = { title: "Order Confirmed" };

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="animate-pulse space-y-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto" />
            <div className="h-8 bg-muted rounded-xl" />
            <div className="h-4 bg-muted rounded-xl w-3/4 mx-auto" />
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent sessionId={searchParams.session_id} />
    </Suspense>
  );
}
