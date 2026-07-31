import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // دریافت توکن به‌صورت سبک و بدون بارگذاری Prisma/Bcrypt در Edge
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  })

  const isLoggedIn = !!token
  const isAdmin = token?.role === "ADMIN"

  // بررسی مسیرهای ادمین و پروفایل و تسویه حساب
  if (!isLoggedIn && (pathname.startsWith("/admin") || pathname.startsWith("/profile") || pathname.startsWith("/checkout"))) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/checkout/:path*"],
}
