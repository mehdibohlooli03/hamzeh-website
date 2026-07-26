// app/orders/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, CreditCard, ChevronLeft } from "lucide-react";

// تبدیل وضعیت‌های انگلیسی دیتابیس به برچسب‌های فارسی و رنگی
const statusMap = {
  PENDING_PAYMENT: { text: "در انتظار پرداخت", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { text: "پرداخت شده", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PROCESSING: { text: "در حال پردازش", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  SHIPPED: { text: "ارسال شده", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  DELIVERED: { text: "تحویل داده شده", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  CANCELLED: { text: "لغو شده", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
};

const paymentTypeMap = {
  ONLINE: "آنلاین",
  COD: "پرداخت در محل (کارت به کارت/نقدی)",
};

export default async function OrdersPage() {
  const session = await auth();

  // اگر کاربر وارد نشده بود، هدایت به صفحه ورود
  if (!session?.user) {
    redirect("/login?callbackUrl=/orders");
  }

  // دریافت سفارش‌های کاربر به همراه جزئیات واریانت‌ها و محصولات
  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          productVariant: {
            include: {
              color: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
      <div className="flex items-center gap-2 mb-8">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">سفارش‌های من</h1>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">هنوز هیچ سفارشی ثبت نکرده‌اید.</p>
            <Link
              href="/products"
              className="mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
            >
              مشاهده محصولات و خرید
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = statusMap[order.status as keyof typeof statusMap] || {
              text: order.status,
              color: "bg-gray-100 text-gray-800",
            };

            return (
              <Card key={order.id} className="overflow-hidden border-muted/60 shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-muted/50 py-4 px-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("fa-IR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span>شناسه سفارش: </span>
                        <code className="font-mono text-xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                          {order.id.slice(-8).toUpperCase()}
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" />
                        <span>روش پرداخت: {paymentTypeMap[order.paymentType as keyof typeof paymentTypeMap] || order.paymentType}</span>
                      </div>
                    </div>
                    <Badge className={`${statusInfo.color} border-none shadow-none font-medium text-xs`}>
                      {statusInfo.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* لیست محصولات سفارش */}
                  <div className="divide-y divide-muted/50">
                    {order.items.map((item) => {
                      const variant = item.productVariant;
                      const product = variant.color.product;

                      return (
                        <div key={item.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            {/* تصویر محصول */}
                            {variant.color.mainImage && (
                              <img
                                src={variant.color.mainImage}
                                alt={product.name}
                                className="h-16 w-12 object-cover rounded bg-muted border border-muted/40"
                              />
                            )}
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm text-foreground">{product.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                رنگ: {variant.color.name} | سایز: {variant.size}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                تعداد: {item.quantity} عدد
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-semibold text-foreground">
                              {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-muted/50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      {order.status === "PENDING_PAYMENT" && (
                        <Link
                          href={`/payment-mock?orderId=${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          پرداخت این سفارش
                          <ChevronLeft className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">مبلغ کل پرداختی:</span>
                      <span className="text-base font-bold text-foreground">
                        {order.totalAmount.toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
