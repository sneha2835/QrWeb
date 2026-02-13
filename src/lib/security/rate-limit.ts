// src/lib/security/rate-limit.ts

import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const windowStart = new Date(now - windowMs).toISOString();

  const { data } = await supabase
    .from("rate_limits")
    .select("id")
    .eq("key", key)
    .gte("created_at", windowStart);

  const count = data?.length ?? 0;

  if (count >= limit) {
    return { allowed: false };
  }

  await supabase.from("rate_limits").insert({
    key,
    created_at: new Date().toISOString(),
  });

  return { allowed: true };
}
