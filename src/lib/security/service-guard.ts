import { getSettings } from "@/lib/db/settings";
import { getServerEnv } from "@/lib/config/env.server";

/**
 * Authoritative service availability guard
 * Timezone-safe, deterministic
 */
export async function assertServiceIsOpen() {
  const settings = await getSettings();
  const env = getServerEnv();

  // 1️⃣ Pause check
  if (settings.orders_paused) {
    throw new Error("SERVICE_PAUSED");
  }

  // 2️⃣ Parse service window (HH:MM)
  const [startH, startM] = settings.service_hours_start
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [endH, endM] = settings.service_hours_end
    .slice(0, 5)
    .split(":")
    .map(Number);

  // 3️⃣ Get current time IN BUSINESS TIMEZONE
  const now = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: env.SERVICE_TIMEZONE,
    })
  );

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // 4️⃣ Same-day window
  if (startMinutes <= endMinutes) {
    if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
      throw new Error("OUTSIDE_SERVICE_HOURS");
    }
  }
  // 5️⃣ Overnight window (e.g. 18:00 → 02:00)
  else {
    if (nowMinutes > endMinutes && nowMinutes < startMinutes) {
      throw new Error("OUTSIDE_SERVICE_HOURS");
    }
  }

  return settings;
}
