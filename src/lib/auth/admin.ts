import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";

const SESSION_COOKIE = "citylink_admin_session";

export async function verifyAdminPassword(plain: string) {
  const env = getEnv();
  return bcrypt.compare(plain, env.ADMIN_PASSWORD_HASH);
}

export async function createAdminSession() {
  const env = getEnv();
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: "authenticated",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === "authenticated";
}
