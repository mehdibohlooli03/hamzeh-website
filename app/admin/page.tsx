import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  await requireAdmin();

  const [usersCount, productsCount, ordersCount, pendingOrdersCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: "PENDING_PAYMENT",
        },
      }),
    ]);

  const quickLinks = [
    { label: "محصولات", href: "/admin/products" },
    { label: "سفارشات", href: "/admin/orders" },
    { label: "کاربران", href: "/admin/users" },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">داشبورد ادمین</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نمای کلی از وضعیت فروشگاه و دسترسی سریع به بخش‌های مدیریتی
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کاربران
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              محصولات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              سفارش‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              در انتظار پرداخت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrdersCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>دسترسی سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border p-5 text-center font-medium transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
