export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { validateOrigin } from "@/lib/security";

export async function POST(req: NextRequest) {
  // CSRF Protection
  if (!validateOrigin(req)) {
      return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
  }

  const cookieStore = await cookies();
  
  // Delete the cookie
  cookieStore.delete("user_puuid");

  return NextResponse.json({ success: true });
}
