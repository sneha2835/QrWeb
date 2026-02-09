import { z } from "zod";

/**
 * Minimal env validation for current phase.
 * DO NOT validate admin password here.
 */
const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  ADMIN_EMAIL: z.string().email(),
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
