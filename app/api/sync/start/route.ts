import { NextRequest, NextResponse } from "next/server";
import { syncSchema } from "@/lib/validations/api";
import { acquireSyncLock, releaseSyncLock, setSyncStatus } from "@/lib/profileCache";
import { computeProfileData } from "../../profile/route"; 
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = syncSchema.safeParse(body);
        
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid params" }, { status: 400 });
        }

        const { puuid } = parsed.data;

        // Try acquire lock
        const locked = await acquireSyncLock(puuid);
        if (!locked) {
             return NextResponse.json({ error: "Sync already in progress" }, { status: 429 });
        }

        // Set running
        await setSyncStatus(puuid, { state: "running", updatedAt: Date.now(), startedAt: Date.now() });

        try {
            // Re-use core logic from profile route (exported or shared)
            // Note: We need to export computeProfileData from profile route or move it to a controller.
            // For now assuming it is exported.
            await computeProfileData(puuid, { forceRiotCheck: true });
            
            await setSyncStatus(puuid, { state: "ok", updatedAt: Date.now() });
            return NextResponse.json({ success: true });
        } catch (error) {
            Sentry.captureException(error, { tags: { puuid, route: "api/sync/start" }});
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await setSyncStatus(puuid, { state: "error", updatedAt: Date.now(), reason: (error as any).message });
            return NextResponse.json({ error: "Sync failed" }, { status: 500 });
        } finally {
            await releaseSyncLock(puuid);
        }

    } catch (e) {
        Sentry.captureException(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
