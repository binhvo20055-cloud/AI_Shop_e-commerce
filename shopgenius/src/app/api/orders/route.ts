import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const createOrderSchema = z.object({
  merchantId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      imageUrl: z.string().url().optional(),
    })
  ).min(1),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  stripePaymentIntentId: z.string().optional(),
});

// GET /api/orders — list user's orders
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: data,
    pagination: { page, limit, total: count ?? 0 },
  });
}

// POST /api/orders — create order
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { merchantId, items, shippingAddress, stripePaymentIntentId } = parsed.data;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const admin = createAdminClient();

  // Verify stock availability
  for (const item of items) {
    const { data: product } = await admin
      .from("products")
      .select("stock, name")
      .eq("id", item.productId)
      .single();

    if (!product || product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product?.name ?? item.productId}"` },
        { status: 409 }
      );
    }
  }

  // Create order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      merchant_id: merchantId,
      status: stripePaymentIntentId ? "confirmed" : "pending",
      total_amount: totalAmount,
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      shipping_address: shippingAddress,
      items: items,
    } as any)
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Decrement stock for each item
  for (const item of items) {
    await (admin as any).rpc("decrement_stock", {
      p_product_id: item.productId,
      p_quantity: item.quantity,
    });
  }

  return NextResponse.json({ order }, { status: 201 });
}
