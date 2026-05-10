import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["pro", "enterprise"]),
});

/**
 * POST /api/stripe/subscription
 * Creates a Stripe Checkout Session for merchant SaaS subscription.
 * Uses Billing APIs + Checkout for the frontend.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get merchant record
  const { data: merchant } = await admin
    .from("merchants")
    .select("id, stripe_customer_id, subscription_status, plan")
    .eq("user_id", user.id)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  }

  // Already on this plan
  if (merchant.plan === parsed.data.plan && merchant.subscription_status === "active") {
    return NextResponse.json({ error: "Already on this plan" }, { status: 409 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  // Get or create Stripe customer
  let stripeCustomerId = merchant.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: profile?.email,
      name: profile?.full_name ?? undefined,
      metadata: {
        supabase_user_id: user.id,
        merchant_id: merchant.id,
      },
    });
    stripeCustomerId = customer.id;

    // Save customer ID
    await admin
      .from("merchants")
      .update({ stripe_customer_id: stripeCustomerId } as any)
      .eq("id", merchant.id);
  }

  // Map plan to price ID
  const priceId =
    parsed.data.plan === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_ENTERPRISE_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured. Set STRIPE_PRO_PRICE_ID in .env.local" },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Create Checkout Session for subscription (Billing API + Checkout)
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?upgraded=true`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: {
      merchant_id: merchant.id,
      supabase_user_id: user.id,
      plan: parsed.data.plan,
    },
    subscription_data: {
      metadata: {
        merchant_id: merchant.id,
        plan: parsed.data.plan,
      },
      trial_period_days: 14, // 14-day free trial
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}

/**
 * DELETE /api/stripe/subscription
 * Cancels the merchant's active subscription at period end.
 */
export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: merchant } = await admin
    .from("merchants")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .single();

  if (!merchant?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  // Cancel at period end (not immediately)
  await stripe.subscriptions.update(merchant.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({ success: true, message: "Subscription will cancel at period end" });
}
