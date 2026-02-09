import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
};

export async function getDamMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category")
    .eq("is_available", true)
    .eq("dam_only", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch menu");
  }

  return data ?? [];
}
