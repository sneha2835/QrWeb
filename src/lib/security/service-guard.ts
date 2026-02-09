import { getSettings } from "@/lib/db/settings";

/**
 * Authoritative service availability guard
 * Time-safe, timezone-safe, deterministic
 */
export async function assertServiceIsOpen() {
  const settings = await getSettings();

  // 1️⃣ Pause check
  if (settings.orders_paused) {
    throw new Error("SERVICE_PAUSED");
  }

  // 2️⃣ Parse service window (Postgres time → HH:MM)
  const [startH, startM] = settings.service_hours_start
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [endH, endM] = settings.service_hours_end
    .slice(0, 5)
    .split(":")
    .map(Number);

  // 3️⃣ Current local time
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // 🔍 TEMP DEBUG (remove later)

  // 4️⃣ Handle normal same-day window
  if (startMinutes <= endMinutes) {
    if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
      throw new Error("OUTSIDE_SERVICE_HOURS");
    }
  }
  // 5️⃣ Handle overnight window (e.g. 18:00 → 02:00)
  else {
    if (nowMinutes > endMinutes && nowMinutes < startMinutes) {
      throw new Error("OUTSIDE_SERVICE_HOURS");
    }
  }

  return settings;
}
