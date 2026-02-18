"use client";

import { useEffect, useState } from "react";

type Settings = {
  id: number;
  service_hours_start: string;
  service_hours_end: string;
  orders_paused: boolean;
  min_order_amount: number;
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", {
      credentials: "same-origin",
    })
      .then(res => res.json())
      .then(data => {
        setSettings({
          id: data.id,
          service_hours_start: data.service_hours_start ?? "00:00",
          service_hours_end: data.service_hours_end ?? "23:59",
          orders_paused: Boolean(data.orders_paused),
          min_order_amount: data.min_order_amount ?? 0,
        });
      });
  }, []);

  if (!settings) {
    return <p>Loading settings…</p>;
  }

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      alert("Settings saved");
    } catch (err) {
      alert("Error saving settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings.orders_paused}
          onChange={e =>
            setSettings({
              ...settings,
              orders_paused: e.target.checked,
            })
          }
        />
        Orders Paused
      </label>

      <div>
        <label className="block text-sm text-slate-600">
          Service Start Time
        </label>
        <input
          type="time"
          value={settings.service_hours_start}
          onChange={e =>
            setSettings({
              ...settings,
              service_hours_start: e.target.value,
            })
          }
          className="mt-1 w-full rounded-md border px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600">
          Service End Time
        </label>
        <input
          type="time"
          value={settings.service_hours_end}
          onChange={e =>
            setSettings({
              ...settings,
              service_hours_end: e.target.value,
            })
          }
          className="mt-1 w-full rounded-md border px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600">
          Minimum Order Amount
        </label>
        <input
          type="number"
          min={0}
          value={settings.min_order_amount}
          onChange={e =>
            setSettings({
              ...settings,
              min_order_amount: Number(e.target.value),
            })
          }
          className="mt-1 w-full rounded-md border px-2 py-1"
        />
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
