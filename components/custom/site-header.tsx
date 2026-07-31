import Link from "next/link";
import { auth } from "@/auth";
import { CartBadge } from "@/components/custom/cart-badge";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/custom/user-menu";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
      dir="rtl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          {/* لوگوی سایت */}
          <Link
            href="/"
            className="text-lg font-black tracking-wider text-black sm:text-xl"
          >
            REAL HAMZEH
          </Link>

          {/* ناوبری دسکتاپ */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/products"
              className="text-sm font-semibold text-gray-600 transition hover:text-black"
            >
              فروشگاه
            </Link>

            <Link
              href="/cart"
              className="text-sm font-semibold text-gray-600 transition hover:text-black"
            >
              سبد خرید
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                پنل ادمین
              </Link>
            )}
          </nav>
        </div>

        {/* بخش سمت چپ هدر (سبد خرید، پروفایل، منوی موبایل) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <CartBadge />

          <div className="h-6 w-px bg-gray-200" />

          {user ? (
            <UserMenu name={user.name} />
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="h-9 px-3 text-xs font-bold text-gray-700 hover:text-black sm:h-10 sm:px-4 sm:text-sm"
                >
                  ورود
                </Button>
              </Link>

              <Link href="/register">
                <Button className="h-9 rounded-xl px-3.5 text-xs font-bold text-white sm:h-10 sm:px-5 sm:text-sm">
                  ثبت‌نام
                </Button>
              </Link>
            </div>
          )}

          {/* منوی موبایل */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 focus:outline-none"
                aria-label="منو"
              >
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="mt-1 w-48" dir="rtl">
                <DropdownMenuItem className="p-0">
                  <Link
                    href="/products"
                    className="block w-full px-2 py-1.5 text-right font-medium"
                  >
                    فروشگاه (همه محصولات)
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="p-0">
                  <Link
                    href="/cart"
                    className="block w-full px-2 py-1.5 text-right font-medium"
                  >
                    سبد خرید
                  </Link>
                </DropdownMenuItem>

                {user?.role === "ADMIN" && (
                  <DropdownMenuItem className="p-0">
                    <Link
                      href="/admin"
                      className="block w-full px-2 py-1.5 text-right font-semibold text-red-600"
                    >
                      پنل ادمین
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
