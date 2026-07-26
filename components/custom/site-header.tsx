import Link from "next/link";
import { auth } from "@/auth";
import { CartBadge } from "@/components/custom/cart-badge";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/custom/user-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur"
      dir="rtl"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black tracking-tight text-primary">
            REAL HAMZEH
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              فروشگاه
            </Link>

            <Link
              href="/cart"
              className="text-sm font-medium text-gray-600 transition hover:text-black"
            >
              سبد خرید
            </Link>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-red-600 transition hover:text-red-700"
              >
                پنل ادمین
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <CartBadge />

          <div className="h-6 w-px bg-gray-200" />

          {user ? (
            <UserMenu name={user.name} />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden font-bold md:flex"
                >
                  ورود
                </Button>
              </Link>

              <Link href="/register">
                <Button size="sm" className="rounded-xl font-bold">
                  ثبت‌نام
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
