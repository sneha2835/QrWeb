import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export type Settings = {
  id: number;
  service_hours_start: string;
  service_hours_end: string;
  orders_paused: boolean;
  min_order_amount: number;
};

const SETTINGS_ID = 1;

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    console.error("SETTINGS_FETCH_FAILED:", error);
    throw new Error("SYSTEM_SETTINGS_FETCH_FAILED");
  }

  if (!data) {
    throw new Error(
      "SYSTEM_SETTINGS_MISSING: expected settings row with id = 1"
    );
  }

  return data;
}

export async function updateSettings(
  updates: Partial<Settings>
) {
  const { error } = await supabase
    .from("settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", SETTINGS_ID);

  if (error) {
    console.error("SETTINGS_UPDATE_FAILED:", error);
    throw new Error("SETTINGS_UPDATE_FAILED");
  }
}
