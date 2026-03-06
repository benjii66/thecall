import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret-for-dev-only");
const COOKIE_NAME = "admin_session";

export async function createAdminSession(username: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);

  (await cookies()).set(COOKIE_NAME, session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function verifyAdminSession() {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, SECRET, {
      algorithms: ["HS256"],
    });
    return payload as { username: string };
  } catch (err) {
    return null;
  }
}

export async function deleteAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}
