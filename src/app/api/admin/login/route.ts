import { NextResponse } from "next/server";
import { verifyAdminPassword, createAdminSession } from "@/lib/auth/admin";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const env = getEnv();

  const body = await req.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 400 }
    );
  }

  if (email !== env.ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  await createAdminSession();

  return NextResponse.json({ success: true });
}
