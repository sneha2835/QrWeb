import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 400 }
    );
  }

  const result = await loginAdmin(email, password);

  if (!result.ok) {
    if (result.locked) {
      return NextResponse.json(
        { error: "Account temporarily locked" },
        { status: 423 }
      );
    }

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
