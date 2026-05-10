import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Handles all Stripe webhook events.
 * Verify signature → process event → return 200.
 *
 * Events handled:
 * - checkout.session.completed       → create order, decrement stock
 * - payment_intent.payment_failed    → notify user
 * - customer.subscription.created   → activate merchant plan
 * - customer.subscription.updated   → update merchant plan status
 * - customer.subscription.deleted   → cancel merchant plan
 * - invoice.payment_succeeded        → record invoice
 * - invoice.payment_failed           → notify merchant
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // ─── ONE-TIME PAYMENT ────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("Payment failed:", pi.id, pi.last_payment_error?.message);
        // Could send notification here via Firebase
        break;
      }

      // ─── SUBSCRIPTIONS ───────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("merchants")
          .update({
            stripe_subscription_id: sub.id,
            subscription_status: sub.status as any,
            plan: getPlanFromSubscription(sub),
          } as any)
          .eq("stripe_customer_id", sub.customer as string);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("merchants")
          .update({
            subscription_status: "cancelled",
            plan: "starter",
          } as any)
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Update order with invoice ID if linked
        if (invoice.payment_intent) {
          await supabase
            .from("orders")
            .update({ stripe_invoice_id: invoice.id } as any)
            .eq("stripe_payment_intent_id", invoice.payment_intent as string);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("Invoice payment failed:", invoice.id, "customer:", invoice.customer);
        break;
      }

      default:
        // Unhandled event — log and return 200 to avoid Stripe retries
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    // Return 200 anyway to prevent Stripe from retrying
    // Log to monitoring service in production
  }

  return NextResponse.json({ received: true });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>
) {
  const meta = session.metadata;
  if (!meta?.supabase_user_id || !meta?.merchant_id || !meta?.items) {
    console.warn("Checkout session missing metadata:", session.id);
    return;
  }

  const items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    productName: string;
  }> = JSON.parse(meta.items);

  const shippingAddress = meta.shipping_address
    ? JSON.parse(meta.shipping_address)
    : session.shipping_details?.address ?? {};

  const totalAmount = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  // Create order record
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: meta.supabase_user_id,
      merchant_id: meta.merchant_id,
      status: "confirmed",
      total_amount: totalAmount,
      stripe_payment_intent_id: session.payment_intent as string,
      shipping_address: shippingAddress,
      items: items,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Failed to create order:", error.message);
    return;
  }

  // Decrement stock atomically for each item
  for (const item of items) {
    const { error: stockError } = await supabase.rpc("decrement_stock" as any, {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });
    if (stockError) {
      console.error(`Stock decrement failed for ${item.productId}:`, stockError.message);
    }
  }

  console.log("Order created:", order?.id, "from session:", session.id);
}

function getPlanFromSubscription(sub: Stripe.Subscription): string {
  // Map Stripe price IDs to plan names
  const priceId = sub.items.data[0]?.price?.id;
  const planMap: Record<string, string> = {
    [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "pro",
    [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? ""]: "enterprise",
  };
  return planMap[priceId ?? ""] ?? "starter";
}
