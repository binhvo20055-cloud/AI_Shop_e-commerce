import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import { z } from "zod";

const notificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["order_confirmed", "order_shipped", "order_delivered", "new_review", "low_stock"]),
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string()).optional(),
});

/**
 * POST /api/notifications
 * Server-side: push a notification to a user's Firestore subcollection.
 * Only callable with service role (internal use / webhooks).
 */
export async function POST(request: NextRequest) {
  // Verify internal secret header
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = notificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId, type, title, message, metadata } = parsed.data;

  try {
    const notifRef = adminDb
      .collection("notifications")
      .doc(userId)
      .collection("items")
      .doc();

    await notifRef.set({
      type,
      title,
      message,
      metadata: metadata ?? {},
      read: false,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true, id: notifRef.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
