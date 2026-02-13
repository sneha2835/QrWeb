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

  if (expected.length !== signature.length) {
    return false;
  }

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

  type RazorpayWebhook = {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id: string;
          amount: number;
        };
      };
    };
  };

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const event = parsed as RazorpayWebhook;
  const eventType = event.event;

  if (!eventType) {
    return NextResponse.json({ error: "INVALID_EVENT_TYPE" }, { status: 400 });
  }

  // Always log webhook
  await supabase.from("payment_webhook_logs").insert({
    event_type: eventType,
    razorpay_payment_id:
      event.payload?.payment?.entity?.id ?? null,
    payload: event,
  });

  // Only handle payment.captured
  if (eventType !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;

  if (!payment?.id || !payment?.order_id || !payment?.amount) {
    return NextResponse.json(
      { error: "INVALID_EVENT_PAYLOAD" },
      { status: 400 }
    );
  }

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
    return NextResponse.json(
      { error: "ORDER_NOT_FOUND" },
      { status: 404 }
    );
  }

  // Idempotency guard
  if (order.payment_status === "PAID") {
    return NextResponse.json({ received: true });
  }

  // Late payment handling
  if (new Date(order.expires_at) < new Date()) {
    await supabase
      .from("cafe_orders")
      .update({ status: "EXPIRED" })
      .eq("id", order.id)
      .eq("payment_status", "PENDING");

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

