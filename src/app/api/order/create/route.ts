import { NextResponse } from "next/server";
import { assertServiceIsOpen } from "@/lib/security/service-guard";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";
import { z } from "zod";
import { rateLimit } from "@/lib/security/rate-limit";

const env = getServerEnv();
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const schema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().min(10),
  delivery_point: z.string().min(3),
  idempotency_key: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      qty: z.number().int().positive(),
    })
  ).min(1),
});



export async function POST(req: Request) {
  try {
    const ip =
  req.headers.get("x-forwarded-for") ??
  req.headers.get("x-real-ip") ??
  "unknown";

const rl = await rateLimit(`order:${ip}`, 5, 60_000);

if (!rl.allowed) {
  return NextResponse.json(
    { error: "TOO_MANY_REQUESTS" },
    { status: 429 }
  );
}
    await assertServiceIsOpen();

    const body = schema.parse(await req.json());
    const uniqueIds = [...new Set(body.items.map(i => i.id))];

    const { data: menu } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .in("id", uniqueIds)
      .eq("is_available", true)
      .eq("dam_only", true);

    if (!menu || menu.length !== uniqueIds.length) {
      return NextResponse.json({ error: "INVALID_ITEMS" }, { status: 400 });
    }

    let subtotal = 0;
    const itemsMap = new Map(menu.map(i => [i.id, i]));

    for (const item of body.items) {
      subtotal += itemsMap.get(item.id)!.price * item.qty;
    }

    const { data: settings, error: settingsError } = await supabase
  .from("settings")
  .select("min_order_amount")
  .eq("id", 1)
  .single();

if (settingsError || !settings) {
  console.error("SETTINGS_MISSING:", settingsError);
  return NextResponse.json(
    { error: "SYSTEM_MISCONFIGURED" },
    { status: 500 }
  );
}

if (subtotal < settings.min_order_amount) {
  return NextResponse.json(
    {
      error: "MIN_ORDER_NOT_MET",
      min_order_amount: settings.min_order_amount,
    },
    { status: 400 }
  );
}


    // 🔒 IDEMPOTENCY CHECK
    const { data: existing } = await supabase
      .from("cafe_orders")

      .select("id, total_amount, status")
      .eq("idempotency_key", body.idempotency_key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        order_id: existing.id,
        amount: existing.total_amount,
        status: existing.status,
      });
    }

    const orderItemsPayload = body.items.map(item => {
      const dbItem = itemsMap.get(item.id)!;
      return {
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        price_at_order: dbItem.price,
        quantity: item.qty,
      };
    });

    const { data: orderId, error } = await supabase.rpc(
      "create_order_with_items",
      {
        p_customer_name: body.customer_name,
        p_customer_phone: body.customer_phone,
        p_delivery_point: body.delivery_point,
        p_subtotal: subtotal,
        p_total_amount: subtotal,
        p_idempotency_key: body.idempotency_key,
        p_items: orderItemsPayload,
      }
    );

    if (error || !orderId) {
      console.error(error);
      return NextResponse.json({ error: "ORDER_CREATION_FAILED" }, { status: 500 });
    }

    return NextResponse.json({
      order_id: orderId,
      amount: subtotal,
      status: "PAYMENT_PENDING",
    });
  } catch {
    return NextResponse.json({ error: "ORDER_CREATION_FAILED" }, { status: 500 });
  }
}
