import { NextResponse } from "next/server";
import { isDemoModeActive } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const isActive = await isDemoModeActive();
  return NextResponse.json({ demoMode: isActive });
}
