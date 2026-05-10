import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/sync
 * Verifies a Firebase ID token and upserts the user profile in Supabase.
 * Called after Firebase sign-in to keep both systems in sync.
 */
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Upsert profile in Supabase
    const supabase = createAdminClient();
    const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: decoded.uid,
        email: decoded.email ?? "",
        full_name: decoded.name ?? null,
        avatar_url: decoded.picture ?? null,
      } as any,
      { onConflict: "id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true, uid: decoded.uid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth sync failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
