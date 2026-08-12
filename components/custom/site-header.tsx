import Link from "next/link";
import { auth } from "@/auth";
import { CartBadge } from "@/components/custom/cart-badge";
import { UserMenu } from "@/components/custom/user-menu";
import {
  House,
  Menu,
  Phone,
  Shirt,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/"
            aria-label="صفحه اصلی"
            title="صفحه اصلی"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <House className="h-5 w-5" strokeWidth={2.2} />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/products"
              className="text-sm font-semibold text-gray-600 transition-colors hover:text-black"
            >
              فروشگاه
            </Link>

            <Link
              href="/cart"
              className="text-sm font-semibold text-gray-600 transition-colors hover:text-black"
            >
              سبد خرید
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-black"
            >
              <Phone className="h-4 w-4" />
              تماس با ما
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
              >
                پنل ادمین
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <CartBadge />

          <div className="h-6 w-px bg-gray-200" />

          {user && <UserMenu name={user.name} />}

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="باز کردن منو"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <Menu className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={10}
                dir="rtl"
                className="w-64 rounded-2xl border-gray-200 bg-white p-2 shadow-xl shadow-black/10"
              >
                <div className="px-3 pb-2 pt-3 text-right">
                  <div className="text-sm font-bold text-gray-900">
                    منوی فروشگاه
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    دسترسی سریع به بخش‌های سایت
                  </div>
                </div>

                <DropdownMenuSeparator className="my-2 bg-gray-100" />

                <DropdownMenuItem
                  render={<Link href="/" />}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-right font-medium text-gray-700 outline-none focus:bg-gray-100"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <House className="h-4 w-4" />
                  </span>

                  <span>صفحه اصلی</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/products" />}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-right font-medium text-gray-700 outline-none focus:bg-gray-100"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <Shirt className="h-4 w-4" />
                  </span>

                  <span>فروشگاه</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/cart" />}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-right font-medium text-gray-700 outline-none focus:bg-gray-100"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <ShoppingCart className="h-4 w-4" />
                  </span>

                  <span>سبد خرید</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/contact" />}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-right font-medium text-gray-700 outline-none focus:bg-gray-100"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <Phone className="h-4 w-4" />
                  </span>

                  <span>تماس با ما</span>
                </DropdownMenuItem>

                {user?.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator className="my-2 bg-gray-100" />

                    <DropdownMenuItem
                      render={<Link href="/admin" />}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-right font-semibold text-red-600 outline-none focus:bg-red-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <ShieldCheck className="h-4 w-4" />
                      </span>

                      <span>پنل ادمین</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
