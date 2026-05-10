import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createMerchantSchema = z.object({
  storeName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

// POST /api/merchants — register as merchant
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMerchantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Check if already a merchant
  const { data: existing } = await admin
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already registered as merchant" }, { status: 409 });
  }

  // Generate unique slug
  let slug = slugify(parsed.data.storeName);
  const { data: slugExists } = await admin
    .from("merchants")
    .select("id")
    .eq("store_slug", slug)
    .single();

  if (slugExists) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const { data: merchant, error } = await admin
    .from("merchants")
    .insert({
      user_id: user.id,
      store_name: parsed.data.storeName,
      store_slug: slug,
      description: parsed.data.description ?? null,
      plan: "starter",
    } as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update profile role to merchant
  await admin
    .from("profiles")
    .update({ role: "merchant" } as any)
    .eq("id", user.id);

  return NextResponse.json({ merchant }, { status: 201 });
}
