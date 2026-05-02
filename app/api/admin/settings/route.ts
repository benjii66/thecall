import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/security";
import { getRedisClient } from "@/lib/redis";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });

  try {
    const session = await verifyAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { key, value } = await req.json();
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });

    // Block sensitive keys
    const sensitiveKeys = ["OPENAI_API_KEY"];
    if (sensitiveKeys.includes(key)) {
      return NextResponse.json({ error: "This key must be set via environment variables only." }, { status: 403 });
    }

    // Upsert the setting
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Clear Redis Cache
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`config:${key}`);
    }

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

    const sensitiveKeys = ["OPENAI_API_KEY"];
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { notIn: sensitiveKeys }
      }
    });
    
    // Mask values for security, but exempt non-sensitive ones like Demo Mode
    const publicKeys = ["NEXT_PUBLIC_DEMO_MODE"];
    const masked = settings.map(s => ({
      key: s.key,
      value: (publicKeys.includes(s.key) || !s.value) 
        ? s.value 
        : `${s.value.substring(0, 8)}...`
    }));

    return NextResponse.json({ settings: masked });
  } catch (err: any) {
    console.error("Settings fetch failed:", err);
    return NextResponse.json({ error: "Internal Error", message: err.message }, { status: 500 });
  }
}
