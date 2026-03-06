export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { validateOrigin } from "@/lib/security";
import { deleteSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  // CSRF Protection
  if (!validateOrigin(req)) {
      return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
  }

  await deleteSession();

  return NextResponse.json({ success: true });
}
