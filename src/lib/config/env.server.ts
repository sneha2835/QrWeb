import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  ADMIN_SESSION_SECRET: z.string().min(32),
  ADMIN_SESSION_MAX_AGE_SECONDS: z.coerce.number().min(3600),

  ADMIN_MAX_LOGIN_ATTEMPTS: z.coerce.number().min(3),
  ADMIN_LOCKOUT_MINUTES: z.coerce.number().min(5),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // 🔑 Business timezone (explicit, deterministic)
  SERVICE_TIMEZONE: z.string().default("Asia/Kolkata"),

  // Optional for now (Razorpay onboarding pending)
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(16),

});

let cached: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid server environment:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment");
  }

  cached = parsed.data;
  return cached;
}
