import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const notificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["order_confirmed", "order_shipped", "order_delivered", "new_review", "low_stock"]),
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = notificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId, type, title, message, metadata } = parsed.data;

  try {
    const { adminDb } = await import("@/lib/firebase/admin");
    const notifRef = adminDb
      .collection("notifications")
      .doc(userId)
      .collection("items")
      .doc();

    await notifRef.set({
      type, title, message,
      metadata: metadata ?? {},
      read: false,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
