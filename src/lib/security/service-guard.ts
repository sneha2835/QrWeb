import { getSettings } from "@/lib/db/settings";

export async function assertServiceIsOpen() {
  const settings = await getSettings();

  if (settings.orders_paused) {
    throw new Error("SERVICE_PAUSED");
  }

  const now = new Date();
  const nowMinutes =
    now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = settings.service_start_time
    .split(":")
    .map(Number);

  const [endH, endM] = settings.service_end_time
    .split(":")
    .map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
    throw new Error("OUTSIDE_SERVICE_HOURS");
  }

  return settings;
}
