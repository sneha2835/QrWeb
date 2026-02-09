// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/config/env.server";

export const runtime = "nodejs";

export async function GET() {
  const env = getServerEnv(); // unified validation

  return NextResponse.json({
    status: "ok",
    service: "citylink-cafe-api",
    env: env.NODE_ENV,
  });
}
