import { NextRequest, NextResponse } from "next/server";
import { getAuthUserSafe } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/security";
import { isDemoModeActive } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const userId = await getAuthUserSafe();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                riotGameName: true,
                riotTagLine: true,
                tier: true,
                themeDynamic: true,
                animationsEnabled: true,
                language: true,
                isPublic: true,
                pushNotifications: true,
                emailNewsletter: true,
                subscription: true,
                usage: true
            }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const isFounder = user.subscription?.priceId === process.env.STRIPE_PRICE_ID_MONTHLY_LAUNCH;

        console.log(`[USER_SETTINGS_API] Fetching for userId: ${userId}, Tier in DB: ${user.tier}, isFounder: ${isFounder}`);

        return NextResponse.json({ ...user, isFounder });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });

    if (await isDemoModeActive()) {
        return NextResponse.json({ error: "Modifications désactivées en mode démo." }, { status: 403 });
    }

    try {
        const userId = await getAuthUserSafe();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { 
            name, 
            email, 
            themeDynamic, 
            animationsEnabled, 
            language, 
            isPublic, 
            pushNotifications, 
            emailNewsletter 
        } = body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                themeDynamic,
                animationsEnabled,
                language,
                isPublic,
                pushNotifications,
                emailNewsletter
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
