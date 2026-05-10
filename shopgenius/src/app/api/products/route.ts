import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string().url()).min(1),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = createAdminClient();

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select("*, categories(name, slug)", { count: "exact" })
    .eq("is_active", true)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category_id", category);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data,
    pagination: { page, limit, total: count ?? 0 },
  });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  // Verify auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      compare_at_price: parsed.data.compareAtPrice ?? null,
      stock: parsed.data.stock,
      sku: parsed.data.sku ?? null,
      category_id: parsed.data.categoryId ?? null,
      images: parsed.data.images,
      processed_images: [],
      merchant_id: body.merchantId,
      is_active: false,
      metadata: {},
    } as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
