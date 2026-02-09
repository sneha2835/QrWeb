import { NextResponse } from "next/server";
import { assertServiceIsOpen } from "@/lib/security/service-guard";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";
import { z } from "zod";

const env = getServerEnv();
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const schema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().min(10),
  delivery_point: z.string().min(3),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      qty: z.number().int().positive(),
    })
  ).min(1),
});

export async function POST(req: Request) {
  try {
    await assertServiceIsOpen();

    const body = schema.parse(await req.json());
    const ids = body.items.map(i => i.id);

    // Fetch menu items
    const { data: menu, error } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .in("id", ids)
      .eq("is_available", true)
      .eq("dam_only", true);

    if (error || !menu || menu.length !== ids.length) {
      return NextResponse.json(
        { error: "INVALID_ITEMS" },
        { status: 400 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    const itemsMap = new Map(menu.map(i => [i.id, i]));

    for (const item of body.items) {
      const dbItem = itemsMap.get(item.id)!;
      subtotal += dbItem.price * item.qty;
    }

    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("min_order_amount")
      .single();

    if (settingsError || !settings) {
      console.error("SETTINGS_MISSING:", settingsError);
      return NextResponse.json(
        { error: "SYSTEM_MISCONFIGURED" },
        { status: 500 }
      );
    }

    // ✅ MIN ORDER ENFORCEMENT (SERVER)
    if (subtotal < settings.min_order_amount) {
      return NextResponse.json(
        {
          error: "MIN_ORDER_NOT_MET",
          min_order_amount: settings.min_order_amount,
        },
        { status: 400 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        delivery_point: body.delivery_point,
        subtotal,
        total: subtotal,
        total_amount: subtotal,
        status: "PAYMENT_PENDING",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("ORDER_INSERT_FAILED:", orderError);
      return NextResponse.json(
        { error: "ORDER_INSERT_FAILED" },
        { status: 500 }
      );
    }

    // Insert order items
    for (const item of body.items) {
      const dbItem = itemsMap.get(item.id)!;
      await supabase.from("order_items").insert({
        order_id: order.id,
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        price: dbItem.price,
        quantity: item.qty,
      });
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.total,
      status: order.status,
    });
  } catch (err) {
    console.error("ORDER_CREATION_FAILED:", err);
    return NextResponse.json(
      { error: "ORDER_CREATION_FAILED" },
      { status: 500 }
    );
  }
}
