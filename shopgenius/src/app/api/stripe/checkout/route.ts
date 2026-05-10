import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      imageUrl: z.string().url().optional(),
    })
  ).min(1),
  merchantId: z.string().uuid(),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().default("US"),
  }),
});

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session (hosted) for one-time product purchases.
 * Returns the session URL to redirect the customer.
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
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, merchantId, shippingAddress } = parsed.data;
  const admin = createAdminClient();

  // Verify stock for all items
  for (const item of items) {
    const { data: product } = await admin
      .from("products")
      .select("stock, name, is_active")
      .eq("id", item.productId)
      .single();

    if (!product || !product.is_active) {
      return NextResponse.json(
        { error: `Product "${item.productName}" is no longer available` },
        { status: 409 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}" (${product.stock} left)` },
        { status: 409 }
      );
    }
  }

  // Get or create Stripe customer for this user
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  let stripeCustomerId: string | undefined;
  const existingCustomers = await stripe.customers.list({
    email: profile?.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    stripeCustomerId = existingCustomers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: profile?.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Build line items for Checkout Session
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.productName,
        ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
      },
      unit_amount: Math.round(item.unitPrice * 100), // cents
    },
    quantity: item.quantity,
  }));

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: stripeCustomerId,
    line_items: lineItems,
    // Dynamic payment methods — Stripe picks best options per customer
    payment_method_types: undefined,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "VN", "SG", "JP"],
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/cart`,
    metadata: {
      supabase_user_id: user.id,
      merchant_id: merchantId,
      items: JSON.stringify(items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        productName: i.productName,
      }))),
      shipping_address: JSON.stringify(shippingAddress),
    },
    // Collect billing address
    billing_address_collection: "auto",
    // Allow promo codes
    allow_promotion_codes: true,
    // Automatic tax (requires Stripe Tax setup)
    // automatic_tax: { enabled: true },
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
