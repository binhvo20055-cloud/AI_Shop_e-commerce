import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/sync
 * Verifies a Firebase ID token and upserts the user profile in Supabase.
 */
export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  // Firebase Admin is optional — gracefully degrade if not configured
  if (
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  ) {
    return NextResponse.json(
      { error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  try {
    // Dynamic import to avoid build-time crash
    const { adminAuth } = await import("@/lib/firebase/admin");
    const decoded = await adminAuth.verifyIdToken(idToken);

    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").upsert(
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
