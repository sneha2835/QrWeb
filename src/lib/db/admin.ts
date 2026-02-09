import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/env.server";

const env = getServerEnv();

const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getAdminByEmail(email: string) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) return null;
  return data;
}

export async function recordFailedLogin(id: string, attempts: number, lockedUntil?: Date) {
  await supabase
    .from("admin_users")
    .update({
      failed_attempts: attempts,
      locked_until: lockedUntil ?? null,
    })
    .eq("id", id);
}

export async function recordSuccessfulLogin(id: string) {
  await supabase
    .from("admin_users")
    .update({
      failed_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", id);
}
