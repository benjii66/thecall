import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });

    // Upsert the setting
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Settings update failed", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await verifyAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.systemSetting.findMany();
    
    // Mask values for security
    const masked = settings.map(s => ({
      key: s.key,
      value: s.value ? `${s.value.substring(0, 8)}...` : ""
    }));

    return NextResponse.json({ settings: masked });
  } catch (err: any) {
    console.error("Settings fetch failed:", err);
    return NextResponse.json({ error: "Internal Error", message: err.message }, { status: 500 });
  }
}
