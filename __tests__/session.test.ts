import { describe, it, expect } from "vitest";
import {
  verifyAdminPassword,
  validateAdminSession,
} from "@/lib/session";

// Mock environment variables
process.env.ADMIN_PASSWORD = "test-password-123";
process.env.ADMIN_SECRET = "test-secret-32-chars-for-hmac!!";

describe("Admin session management", () => {
  it("returns a token for correct password", () => {
    const token = verifyAdminPassword("test-password-123");
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("returns null for incorrect password", () => {
    const token = verifyAdminPassword("wrong-password");
    expect(token).toBeNull();
  });

  it("validates a freshly generated token", () => {
    const token = verifyAdminPassword("test-password-123");
    expect(token).not.toBeNull();
    expect(validateAdminSession(token!)).toBe(true);
  });

  it("rejects a tampered token", () => {
    expect(validateAdminSession("invalid-base64-token")).toBe(false);
  });

  it("rejects a token with modified payload", () => {
    const token = verifyAdminPassword("test-password-123");
    expect(token).not.toBeNull();
    // Decode, modify, re-encode
    const decoded = JSON.parse(Buffer.from(token!, "base64").toString("utf-8"));
    decoded.payload = JSON.stringify({ role: "superadmin", iat: Date.now() });
    const tampered = Buffer.from(JSON.stringify(decoded)).toString("base64");
    expect(validateAdminSession(tampered)).toBe(false);
  });
});
