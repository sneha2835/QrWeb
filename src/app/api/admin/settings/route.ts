import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { getSettings, updateSettings } from "@/lib/db/settings";

export const runtime = "nodejs";

const settingsUpdateSchema = z.object({
  service_hours_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional(),
  service_hours_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/).optional(),
  orders_paused: z.boolean().optional(),
  min_order_amount: z.number().min(0).optional(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const body = settingsUpdateSchema.parse(rawBody);

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
    }

    await updateSettings(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD", details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("SETTINGS_UPDATE_FAILED:", err);
    return NextResponse.json({ error: "SETTINGS_UPDATE_FAILED" }, { status: 500 });
  }
}
