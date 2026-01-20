export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { riotFetch } from "@/lib/riot";
import { ensureUser } from "@/lib/db/ensureUser";
import { validateGameName, validateTagLine, sanitizeForUrl, validateOrigin } from "@/lib/security";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // 0. CSRF Protection
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
  }

  // 1. Rate Limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.account); // Reuse account limits for login

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { gameName, tagLine } = body;

    // 2. Validation
    const validGameName = validateGameName(gameName);
    const validTagLine = validateTagLine(tagLine);

    if (!validGameName || !validTagLine) {
      return NextResponse.json(
        { error: "Invalid Riot ID format." },
        { status: 400 }
      );
    }

    // 3. Riot API Lookup (Resolve PUUID)
    const safeGameName = sanitizeForUrl(validGameName);
    const safeTagLine = sanitizeForUrl(validTagLine);

    const riotAccount = await riotFetch<{ puuid: string; gameName: string; tagLine: string }>(
      `/riot/account/v1/accounts/by-riot-id/${safeGameName}/${safeTagLine}`
    );

    if (!riotAccount?.puuid) {
        return NextResponse.json(
            { error: "Riot ID not found." },
            { status: 404 }
        );
    }

    // 4. DB Persistence (Upsert User)
    await ensureUser({
        riotPuuid: riotAccount.puuid,
        riotGameName: riotAccount.gameName,
        riotTagLine: riotAccount.tagLine,
        riotRegion: "europe", // Defaulting to europe as per current app logic
    });

    // 5. Set Secure Cookie
    // "user_puuid is ONLY for selecting the Riot profile to analyze (public data)."
    const cookieStore = await cookies();
    cookieStore.set("user_puuid", riotAccount.puuid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ success: true, gameName: riotAccount.gameName, tagLine: riotAccount.tagLine });

  } catch (error: unknown) {
    logger.error("[Auth] Login failed", error);
    
    // Handle specific Riot errors if possible, or return generic
    const err = error as { status?: number };
    if (err.status === 404) {
         return NextResponse.json({ error: "Riot ID not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Login failed. Please verify your Riot ID." },
      { status: 500 }
    );
  }
}
