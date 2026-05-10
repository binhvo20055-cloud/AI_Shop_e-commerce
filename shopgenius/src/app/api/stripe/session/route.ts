import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";

/**
 * GET /api/stripe/session?id=cs_xxx
 * Retrieves a Checkout Session to display order confirmation details.
 * Only returns safe, non-sensitive fields.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    return NextResponse.json({
      customerEmail: session.customer_details?.email ?? null,
      amountTotal: session.amount_total,
      currency: session.currency ?? "usd",
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
