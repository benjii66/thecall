import { NextRequest, NextResponse } from "next/server";
import { getSyncStatus } from "@/lib/profileCache";
import { profileSchema } from "@/lib/validations/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const puuid = searchParams.get("puuid");

    // Re-use Zod schema partial check? Or simple check. Using Zod for consistency.
    const parsed = profileSchema.pick({ puuid: true }).safeParse({ puuid: puuid || "" });
    
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid puuid" }, { status: 400 });
    }

    const status = await getSyncStatus(parsed.data.puuid);
    
    return NextResponse.json(status || { state: "idle", updatedAt: Date.now() });
}
