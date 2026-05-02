import { NextResponse } from "next/server";
import { deleteAdminSession } from "@/lib/admin-auth";
import { validateOrigin } from "@/lib/security";

export async function POST(req: Request) {
  if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
  await deleteAdminSession();
  return NextResponse.json({ success: true });
}
