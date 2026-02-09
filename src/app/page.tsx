"use client";

import { useEffect, useState } from "react";

export function SettingsPanel() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(setSettings);
  }, []);

  if (!settings) return <p>Loading settings…</p>;

  async function save() {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    alert("Settings saved");
  }

  return (
    <div className="mt-6 space-y-3">
      <label>
        <input
          type="checkbox"
          checked={settings.orders_paused}
          onChange={e =>
            setSettings({ ...settings, orders_paused: e.target.checked })
          }
        />
        Orders Paused
      </label>

      <input
        type="time"
        value={settings.service_start_time}
        onChange={e =>
          setSettings({ ...settings, service_start_time: e.target.value })
        }
      />

      <input
        type="time"
        value={settings.service_end_time}
        onChange={e =>
          setSettings({ ...settings, service_end_time: e.target.value })
        }
      />

      <input
        type="number"
        value={settings.minimum_order_value}
        onChange={e =>
          setSettings({ ...settings, minimum_order_value: Number(e.target.value) })
        }
      />

      <button onClick={save}>Save</button>
    </div>
  );
}
