// src/app/api/payment/webhook/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";

export const runtime = "nodejs";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySignature(rawBody: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "NO_SIGNATURE" }, { status: 400 });
  }

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  const eventType = event.event;

  // Log webhook first (always)
  await supabase.from("payment_webhook_logs").insert({
    event_type: eventType,
    razorpay_payment_id:
      event.payload?.payment?.entity?.id ?? null,
    payload: event,
  });

  if (eventType !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload.payment.entity;

  const razorpayPaymentId = payment.id;
  const razorpayOrderId = payment.order_id;
  const amount = payment.amount / 100;

  // Fetch order
  const { data: order, error } = await supabase
    .from("cafe_orders")
    .select("*")
    .eq("razorpay_order_id", razorpayOrderId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  // Idempotency guard
  if (order.payment_status === "PAID") {
    return NextResponse.json({ received: true });
  }

  // Late payment check
  if (new Date(order.expires_at) < new Date()) {
    // TODO: trigger refund
    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "LATE_PAYMENT_RECEIVED",
      metadata: { razorpayPaymentId },
    });

    return NextResponse.json({ received: true });
  }

  // Atomic update
  const { error: updateError } = await supabase
    .from("cafe_orders")
    .update({
      payment_status: "PAID",
      paid_at: new Date().toISOString(),
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      status: "CONFIRMED",
    })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json(
      { error: "UPDATE_FAILED" },
      { status: 500 }
    );
  }

  // Log event
  await supabase.from("order_events").insert({
    order_id: order.id,
    event_type: "PAYMENT_CAPTURED",
    metadata: {
      razorpayPaymentId,
      amount,
    },
  });

  return NextResponse.json({ received: true });
}
