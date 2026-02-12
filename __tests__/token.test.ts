import { describe, it, expect } from "vitest";
import { generateClaimToken, hashToken, verifyToken, tokenLast4 } from "@/lib/token";

describe("Token utilities", () => {
  it("generates a 64-character hex token", () => {
    const token = generateClaimToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("generates unique tokens each time", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateClaimToken()));
    expect(tokens.size).toBe(100);
  });

  it("hashes a token to a consistent SHA-256 hex string", () => {
    const token = "abc123def456";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(token);
  });

  it("different tokens produce different hashes", () => {
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("verifies a correct token against its hash", () => {
    const token = generateClaimToken();
    const hash = hashToken(token);
    expect(verifyToken(token, hash)).toBe(true);
  });

  it("rejects an incorrect token against a hash", () => {
    const token = generateClaimToken();
    const hash = hashToken(token);
    const wrongToken = generateClaimToken();
    expect(verifyToken(wrongToken, hash)).toBe(false);
  });

  it("returns the last 4 characters of a token", () => {
    const token = "abcdef1234567890";
    expect(tokenLast4(token)).toBe("7890");
  });
});
