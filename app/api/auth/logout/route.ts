export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete the cookie
  cookieStore.delete("user_puuid");

  return NextResponse.json({ success: true });
}
