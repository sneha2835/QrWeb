import { NextResponse } from "next/server";
import { assertServiceIsOpen } from "@/lib/security/service-guard";
import { getDamMenu } from "@/lib/db/menu";

export const runtime = "nodejs";

export async function GET() {
  try {
    await assertServiceIsOpen();
  } catch {
    return NextResponse.json(
      { error: "SERVICE_CLOSED" },
      { status: 403 }
    );
  }

  try {
    const items = await getDamMenu();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("MENU_FETCH_FAILED:", err);
    return NextResponse.json(
      { error: "MENU_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
