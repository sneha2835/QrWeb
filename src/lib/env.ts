import { z } from "zod";

/**
 * Only validate what we ACTUALLY need right now.
 * No fallbacks. No overrides. No surprises.
 */
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Admin auth (CRITICAL)
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(32),
  ADMIN_AUTH_SECRET: z.string().min(32),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Environment validation failed");
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
