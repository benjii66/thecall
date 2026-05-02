import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";
import { validateOrigin } from "@/lib/security";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });

  const identifier = getRateLimitIdentifier(req);
  const rateLimit = await checkRateLimit(identifier, RATE_LIMITS.coaching);
  
  if (!rateLimit.allowed) {
    logger.warn("[ADMIN] Login rate limit exceeded", { identifier });
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const { username, password } = await req.json();
    const expectedUser = (process.env.ADMIN_USER || "").trim();
    const rawHashedPass = (process.env.ADMIN_PASS || "").trim();
    
    // Nettoyage des guillemets éventuels
    const hashedPass = rawHashedPass.replace(/^['"]|['"]$/g, "").trim();

    const isUserMatch = username === expectedUser;
    
    let isPasswordValid = false;
    if (isUserMatch && hashedPass) {
        isPasswordValid = await bcrypt.compare(password, hashedPass);
    }

    if (isPasswordValid) {
      logger.info("[ADMIN] Successful login", { user: username });
      await createAdminSession(username);
      return NextResponse.json({ success: true });
    }

    // LOG DE L'ÉCHEC
    logger.warn("[ADMIN] Failed login attempt", { 
        user: username,
        reason: !isUserMatch ? "User mismatch" : "Password mismatch",
        ip: req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown" 
    });

    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 }
    );
  } catch (error: any) {
    logger.error("[ADMIN] Internal error during login", { message: error.message });
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
