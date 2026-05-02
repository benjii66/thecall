import { cookies } from "next/headers";
import crypto from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET as string;
if (!SESSION_SECRET) throw new Error("SESSION_SECRET manquant !");

/**
 * Signe une valeur avec HMAC-SHA256
 */
function sign(value: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64")
    .replace(/=/g, "");
}

/**
 * Vérifie une signature
 */
function verify(value: string, signature: string, secret: string): boolean {
  const expected = sign(value, secret);
  return expected === signature;
}

/**
 * Crée un cookie de session sécurisé
 */
export async function createSession(userId: string, riotPuuid?: string) {
  const signature = sign(userId, SESSION_SECRET);
  const sessionValue = `${userId}.${signature}`;
  
  const cookieStore = await cookies();
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  };

  cookieStore.set("session", sessionValue, cookieOptions);
  
  if (riotPuuid) {
    cookieStore.set("user_puuid", riotPuuid, cookieOptions);
  }
}

/**
 * Récupère le userId d'une session valide
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  
  if (!session) return null;
  
  const [userId, signature] = session.split(".");
  if (!userId || !signature) return null;
  
  if (verify(userId, signature, SESSION_SECRET)) {
    return userId;
  }
  
  return null;
}

import { verifyAdminSession } from "./admin-auth";
import { prisma } from "./prisma";

/**
 * Robust authentication: 
 * 1. Try secure user session
 * 2. Fallback to Admin session (Bypass for owner/dev)
 */
export async function getAuthUserSafe(): Promise<string | null> {
  // 1. Session classique
  const sessionUserId = await getSessionUserId();
  if (sessionUserId) return sessionUserId;

  // 2. Bypass Admin : Si on est connecté au panel admin, on cherche l'utilisateur 
  // qui correspond au PUUID de config pour permettre les tests.
  try {
    const adminSession = await verifyAdminSession();
    if (adminSession) {
      // On cherche l'utilisateur qui a le PUUID "maître"
      const masterPuuid = process.env.MY_PUUID;
      if (masterPuuid) {
        const user = await prisma.user.findFirst({
          where: { riotPuuid: masterPuuid },
          select: { id: true }
        });
        if (user) return user.id;
      }
    }
  } catch (e) {
    // Ignore error
  }

  return null;
}

/**
 * Supprime la session
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("user_puuid");
}
