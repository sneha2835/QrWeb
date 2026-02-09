import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function POST() {
  await destroyAdminSession();

  return NextResponse.redirect(
    new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL),
    { status: 303 }
  );
}
