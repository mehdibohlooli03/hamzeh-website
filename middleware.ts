import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  console.log("[MIDDLEWARE DEBUG]", {
    pathname,
    hasToken: !!token,
    role: token?.role ?? null,
    emailSuffix: token?.email ? `***${token.email.slice(-4)}` : "no-email",
  });

  const isLoggedIn = !!token;
  const isAdmin = token?.role === "ADMIN";

  if (
    !isLoggedIn &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/checkout"))
  ) {
    console.log("[MIDDLEWARE] Redirecting to /login because not logged in");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    console.log("[MIDDLEWARE] Redirecting to / because not admin");
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/checkout/:path*"],
};
