import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes (except login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminCookie = request.cookies.get("admin_session");
    if (!adminCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Cookie validation is done in the API routes themselves
    // since we need crypto which isn't available in edge middleware easily
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
