import Link from "next/link";
import { auth } from "@/auth";
import { CartBadge } from "@/components/custom/cart-badge";
import { UserMenu } from "@/components/custom/user-menu";
import { House, Menu, Phone } from "lucide-react";
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
        {/* سمت راست: خانه و لینک‌های اصلی */}
        <div className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/"
            aria-label="صفحه اصلی"
            title="صفحه اصلی"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 transition-all hover:bg-gray-100 hover:text-black"
          >
            <House className="h-5 w-5" strokeWidth={2.2} />
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

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition hover:text-black"
            >
              <Phone className="h-4 w-4" />
              تماس با ما
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

        {/* سمت چپ: سبد خرید، پروفایل و منوی موبایل */}
        <div className="flex items-center gap-2 sm:gap-3">
          <CartBadge />

          <div className="h-6 w-px bg-gray-200" />

          {user && <UserMenu name={user.name} />}

          {/* منوی موبایل */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 focus:outline-none"
                aria-label="باز کردن منو"
              >
                <Menu className="h-5 w-5" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="mt-1 w-52" dir="rtl">
                <DropdownMenuItem className="p-0">
                  <Link
                    href="/"
                    className="flex w-full items-center gap-2 px-3 py-2 text-right font-medium"
                  >
                    <House className="h-4 w-4" />
                    صفحه اصلی
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="p-0">
                  <Link
                    href="/products"
                    className="block w-full px-3 py-2 text-right font-medium"
                  >
                    فروشگاه
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="p-0">
                  <Link
                    href="/cart"
                    className="block w-full px-3 py-2 text-right font-medium"
                  >
                    سبد خرید
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="p-0">
                  <Link
                    href="/contact"
                    className="flex w-full items-center gap-2 px-3 py-2 text-right font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    تماس با ما
                  </Link>
                </DropdownMenuItem>

                {user?.role === "ADMIN" && (
                  <DropdownMenuItem className="p-0">
                    <Link
                      href="/admin"
                      className="block w-full px-3 py-2 text-right font-semibold text-red-600"
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
