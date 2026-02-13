import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";
import { z } from "zod";

export const runtime = "nodejs";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔒 Allowed order status transitions
const transitions: Record<string, string[]> = {
  PAYMENT_PENDING: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

const schema = z.object({
  status: z
    .enum([
      "PAYMENT_PENDING",
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ])
    .optional(),

  payment_status: z.enum(["PENDING", "PAID"]).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  // 🔐 Admin auth
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // 🔑 Unwrap params (Next.js 16 requirement)
  const { id } = await ctx.params;

  // ✅ Validate body
  const body = schema.parse(await req.json());

  if (!body.status && !body.payment_status) {
    return NextResponse.json(
      { error: "NO_FIELDS_PROVIDED" },
      { status: 400 }
    );
  }

  // 🔍 Fetch current order
  const { data: order, error } = await supabase
    .from("cafe_orders")

    .select("status, payment_status, razorpay_order_id")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { error: "ORDER_NOT_FOUND" },
      { status: 404 }
    );
  }

  const update: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // 🔁 Status transition validation
  if (body.status) {
    const allowed = transitions[order.status] ?? [];

    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        {
          error: "INVALID_STATUS_TRANSITION",
          from: order.status,
          to: body.status,
        },
        { status: 400 }
      );
    }

    update.status = body.status;
  }

// 💰 Cash payment support (SAFE)
if (body.payment_status) {
  // Already paid guard
  if (order.payment_status === "PAID") {
    return NextResponse.json(
      { error: "ALREADY_PAID" },
      { status: 400 }
    );
  }

  // 🔒 Block manual override if Razorpay is involved
  if (order.razorpay_order_id) {
    return NextResponse.json(
      {
        error: "CANNOT_MARK_PAID_FOR_ONLINE_ORDER",
      },
      { status: 400 }
    );
  }

  update.payment_status = body.payment_status;
}


  // ✅ Apply update
  await supabase.from("cafe_orders").update(update).eq("id", id);
  return NextResponse.json({ success: true });
}
