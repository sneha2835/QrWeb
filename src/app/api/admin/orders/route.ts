import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";
import { rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req: Request) {
  // 🔒 RATE LIMIT (BUG D FIX)
  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = await rateLimit(`admin-orders:${ip}`, 60, 60_000);


  if (!rl.allowed) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS" },
      { status: 429 }
    );
  }

  // 🔐 Admin auth
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("cafe_orders")
    .select(`
      id,
      customer_name,
      customer_phone,
      delivery_point,
      subtotal,
      total_amount,
      status,
      payment_status,
      razorpay_order_id,
      created_at,
      order_items (
        id,
        item_name,
        quantity,
        price_at_order
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN_ORDERS_FETCH_FAILED:", error);
    return NextResponse.json(
      { error: "ORDERS_FETCH_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ orders: data });
}
