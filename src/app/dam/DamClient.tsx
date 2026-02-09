"use client";

import { useState } from "react";

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type Props = {
  items: MenuItem[];
};

const MIN_ORDER = 199; // 🔧 change anytime or later fetch from admin settings

export default function DamClient({ items }: Props) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [point, setPoint] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function increment(id: string) {
    setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function decrement(id: string) {
    setCart(prev => {
      const qty = (prev[id] ?? 0) - 1;
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: qty };
    });
  }

  const cartItems = items.filter(i => cart[i.id]);
  const subtotal = cartItems.reduce(
    (sum, i) => sum + i.price * cart[i.id],
    0
  );

  async function placeOrder() {
    if (!name || !phone || !point) {
      setMessage("Please fill all details");
      return;
    }

    if (subtotal < MIN_ORDER) {
      setMessage(`Minimum order value is ₹${MIN_ORDER}`);
      return;
    }

    setLoading(true);
    setMessage(null);

    const payload = {
      customer_name: name,
      customer_phone: phone,
      delivery_point: point,
      items: cartItems.map(i => ({
        id: i.id,
        qty: cart[i.id],
      })),
    };

    try {
      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "MIN_ORDER_NOT_MET") {
          setMessage(`Minimum order is ₹${data.min_order_amount}`);
        } else {
          setMessage(data.error ?? "Order failed");
        }
        setLoading(false);
        return;
      }

      setMessage(
        `Order placed successfully!\nOrder ID: ${data.order_id}\nAmount: ₹${subtotal}`
      );
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold">Order</h2>

      {/* MENU */}
      <ul className="space-y-3">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-600">₹{item.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => decrement(item.id)}
                className="h-8 w-8 rounded bg-slate-200"
              >
                −
              </button>
              <span className="w-6 text-center">
                {cart[item.id] ?? 0}
              </span>
              <button
                onClick={() => increment(item.id)}
                className="h-8 w-8 rounded bg-teal-600 text-white"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* CART SUMMARY */}
      <div className="rounded border p-4 space-y-3">
        <p className="font-medium">Subtotal: ₹{subtotal}</p>

        {subtotal > 0 && subtotal < MIN_ORDER && (
          <p className="text-sm text-red-600">
            Minimum order value is ₹{MIN_ORDER}
          </p>
        )}

        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        <input
          placeholder="Delivery Point (e.g. Parking Area)"
          value={point}
          onChange={e => setPoint(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />

        {message && (
          <p className="text-sm text-red-600 whitespace-pre-line">
            {message}
          </p>
        )}

        <button
          onClick={placeOrder}
          disabled={loading || subtotal < MIN_ORDER}
          className="w-full rounded bg-teal-700 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Placing Order…" : "Place Order"}
        </button>
      </div>
    </section>
  );
}
