import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const env = getEnv();

  return NextResponse.json(
    {
      status: "ok",
      service: "citylink-cafe-api",
      env: env.NODE_ENV,
    },
    { status: 200 }
  );
}
