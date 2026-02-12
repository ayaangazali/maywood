import crypto from "crypto";

/**
 * Generate a cryptographically secure random token (hex-encoded).
 * Returns 32 random bytes = 64 hex characters.
 */
export function generateClaimToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a claim token using SHA-256 for secure storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a raw token against a stored hash.
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

/**
 * Get the last 4 characters of a token for debugging.
 */
export function tokenLast4(token: string): string {
  return token.slice(-4);
}
