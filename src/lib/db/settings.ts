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
  // 🔑 Fetch the single row ID first (Supabase requires WHERE)
  const { data, error: fetchError } = await supabase
    .from("settings")
    .select("id")
    .single();

  if (fetchError || !data) {
    throw new Error("Settings row not found");
  }

  const { error } = await supabase
    .from("settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id); // ✅ explicit WHERE clause

  if (error) {
    console.error(error);
    throw new Error("Failed to update settings");
  }
}
