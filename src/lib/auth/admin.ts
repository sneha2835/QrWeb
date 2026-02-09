import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/config/env.server";
import {
  getAdminByEmail,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/db/admin";
import { verifyPassword } from "@/lib/security/password";

const SESSION_COOKIE = "citylink_admin_session";

export async function loginAdmin(email: string, password: string) {
  const env = getServerEnv();
  const admin = await getAdminByEmail(email);

  if (!admin) return { ok: false };

  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    return { ok: false, locked: true };
  }

  const valid = await verifyPassword(password, admin.password_hash);

  if (!valid) {
    const attempts = (admin.failed_attempts ?? 0) + 1;

    const lockUntil =
      attempts >= env.ADMIN_MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + env.ADMIN_LOCKOUT_MINUTES * 60_000)
        : undefined;

    await recordFailedLogin(admin.id, attempts, lockUntil);
    return { ok: false };
  }

  await recordSuccessfulLogin(admin.id);

  const cookieStore = await cookies(); // ✅ REQUIRED

  cookieStore.set({
    name: SESSION_COOKIE,
    value: admin.id,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: env.ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true };
}

export async function logoutAdmin() {
  const cookieStore = await cookies(); // ✅ REQUIRED
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies(); // ✅ REQUIRED
  return Boolean(cookieStore.get(SESSION_COOKIE));
}
