import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export type Settings = {
  service_start_time: string;
  service_end_time: string;
  orders_paused: boolean;
  minimum_order_value: number;
  geo_radius_meters: number;
};

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("System settings not found");
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
    .eq("id", "global");

  if (error) {
    throw new Error("Failed to update settings");
  }
}
