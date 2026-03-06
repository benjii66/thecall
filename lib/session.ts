import { cookies } from "next/headers";
import crypto from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "fallback-secret-at-least-32-chars-long-!!!";

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
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  };

  cookieStore.set("session", sessionValue, cookieOptions);
  
  if (riotPuuid) {
    cookieStore.set("user_puuid", riotPuuid, {
      ...cookieOptions,
      httpOnly: false, // Accessible by client to identify current player context if needed
    });
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

/**
 * Supprime la session
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("user_puuid");
}
