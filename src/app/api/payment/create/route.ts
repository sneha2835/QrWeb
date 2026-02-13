import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";
import { rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

// Load validated environment
const env = getServerEnv();

// Initialize Razorpay ONCE
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID!,
  key_secret: env.RAZORPAY_KEY_SECRET!,
});

// Supabase admin client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req: Request) {
  try {
    // 🔒 RATE LIMIT (MUST BE INSIDE FUNCTION)
    const ip =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = await rateLimit(`payment:${ip}`, 5, 60_000);


    if (!rl.allowed) {
      return NextResponse.json(
        { error: "TOO_MANY_REQUESTS" },
        { status: 429 }
      );
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json(
        { error: "ORDER_ID_REQUIRED" },
        { status: 400 }
      );
    }

    // Fetch order
    const { data: order, error } = await supabase
      .from("cafe_orders")

      .select(
        "id, total_amount, razorpay_order_id, payment_status, status, expires_at"
      )
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 🔒 Guards (Bug 2)
    if (order.payment_status === "PAID") {
      return NextResponse.json(
        { error: "ORDER_ALREADY_PAID" },
        { status: 400 }
      );
    }

    if (order.razorpay_order_id) {
      return NextResponse.json(
        {
          error: "PAYMENT_ALREADY_INITIATED",
          razorpay_order_id: order.razorpay_order_id,
        },
        { status: 400 }
      );
    }

    if (order.status !== "PAYMENT_PENDING") {
      return NextResponse.json(
        { error: "INVALID_ORDER_STATE" },
        { status: 400 }
      );
    }

    if (new Date(order.expires_at) < new Date()) {
      await supabase
        .from("cafe_orders")
        .update({ status: "EXPIRED" })
        .eq("id", order.id)
        .eq("payment_status", "PENDING");

      return NextResponse.json(
        { error: "ORDER_EXPIRED" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total_amount) * 100),
      currency: "INR",
      receipt: order.id,
    });

    // Persist Razorpay reference
    await supabase
      .from("cafe_orders")

      .update({
        razorpay_order_id: razorpayOrder.id,
        payment_status: "PENDING",
      })
      .eq("id", order.id);

    return NextResponse.json({
      key: env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpay_order_id: razorpayOrder.id,
    });
  } catch (err) {
    console.error("PAYMENT_CREATE_FAILED:", err);
    return NextResponse.json(
      { error: "PAYMENT_CREATE_FAILED" },
      { status: 500 }
    );
  }
}
