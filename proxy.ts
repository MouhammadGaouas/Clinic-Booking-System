import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;
  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  if (
    !sessionToken &&
    (path.startsWith("/dashboard") ||
      path.startsWith("/schedule") ||
      path.startsWith("/admin"))
  ) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/schedule", "/admin/:path*"],
};
