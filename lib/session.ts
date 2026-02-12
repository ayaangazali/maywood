import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not set");
  return secret;
}

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD is not set");
  return pw;
}

/**
 * Verify the admin password and return a signed session token.
 */
export function verifyAdminPassword(password: string): string | null {
  if (password !== getAdminPassword()) return null;

  const payload = JSON.stringify({ role: "admin", iat: Date.now() });
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(JSON.stringify({ payload, hmac })).toString("base64");
}

/**
 * Validate an admin session token.
 */
export function validateAdminSession(token: string): boolean {
  try {
    const { payload, hmac } = JSON.parse(
      Buffer.from(token, "base64").toString("utf-8")
    );
    const expectedHmac = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return false;
    }

    const { iat } = JSON.parse(payload);
    const age = (Date.now() - iat) / 1000;
    return age < COOKIE_MAX_AGE;
  } catch {
    return false;
  }
}

/**
 * Set the admin session cookie.
 */
export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/admin",
  });
}

/**
 * Check if the current request has a valid admin session.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return validateAdminSession(token);
}

/**
 * Clear the admin session cookie.
 */
export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
