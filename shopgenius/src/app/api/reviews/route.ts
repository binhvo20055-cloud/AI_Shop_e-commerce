import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// GET /api/reviews?productId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const avgRating =
    data && data.length > 0
      ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
      : 0;

  return NextResponse.json({
    reviews: data,
    stats: {
      count: data?.length ?? 0,
      avgRating: Math.round(avgRating * 10) / 10,
    },
  });
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if user has purchased this product
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "delivered")
    .contains("items", [{ productId: parsed.data.productId }])
    .limit(1)
    .single();

  const { data, error } = await admin
    .from("reviews")
    .insert({
      product_id: parsed.data.productId,
      user_id: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      is_verified_purchase: !!order,
    } as any)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review: data }, { status: 201 });
}
