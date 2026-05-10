import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { z } from "zod";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })
  ),
  currency: z.string().default("usd"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { items, currency } = parsed.data;

  // Calculate total in cents
  const amount = Math.round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  );

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(items.map((i) => i.productId)),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment intent creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
