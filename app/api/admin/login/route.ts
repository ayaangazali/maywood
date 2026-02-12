import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/session";
import { checkRateLimit, LOGIN_RATE_LIMIT } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`admin-login:${ip}`, LOGIN_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
  }

  try {
    const { password } = await request.json();
    const token = verifyAdminPassword(password);

    if (!token) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await setAdminCookie(token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN LOGIN] Error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
