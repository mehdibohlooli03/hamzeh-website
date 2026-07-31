import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Calendar,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  ShoppingBag,
} from "lucide-react";

function getStatusDetails(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        text: "در انتظار پرداخت",
        color:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
        icon: Clock,
      };
    case "PAID":
      return {
        text: "تسویه کامل",
        color:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
        icon: CheckCircle2,
      };
    case "DEPOSIT_PAID":
      return {
        text: "بیعانه پرداخت شده",
        color:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
        icon: Wallet,
      };
    case "CANCELLED":
      return {
        text: "لغو شده",
        color:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
        icon: XCircle,
      };
    default:
      return {
        text: "نامشخص",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: Clock,
      };
  }
}

const paymentTypeMap = {
  FULL: "تسویه نقدی کامل",
  DEPOSIT: "پرداخت بیعانه (۳۰٪)",
};

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/orders");
  }

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
    <div className="container mx-auto max-w-4xl px-4 py-12" dir="rtl">
      <div className="mb-10 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black shadow-xl shadow-black/10 dark:bg-white">
          <Package className="h-7 w-7 text-white dark:text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            سفارش‌های من
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            تاریخچه خریدها و وضعیت فاکتورهای شما
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="rounded-[2.5rem] border-2 border-dashed border-gray-100 py-24 shadow-none">
          <CardContent className="flex flex-col items-center justify-center gap-6">
            <div className="rounded-full bg-gray-50 p-8 text-gray-200">
              <ShoppingBag className="h-16 w-16" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                هنوز سفارشی ثبت نکرده‌اید
              </p>
              <p className="mt-1 text-muted-foreground">
                محصولات مورد علاقه خود را پیدا کنید و اولین خریدتان را انجام دهید
              </p>
            </div>
            <Button asChild className="h-12 rounded-xl px-10 text-base font-bold">
              <Link href="/">شروع گشت و گذار</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = getStatusDetails(order.status);
            const StatusIcon = statusInfo.icon;

            const totalAmount = order.totalAmount || 0;
            const depositAmount = order.depositAmount || 0;
            const isPendingPayment = order.status === "PENDING_PAYMENT";
            const paidAmount = isPendingPayment
              ? 0
              : order.paymentType === "DEPOSIT"
                ? depositAmount
                : totalAmount;

            return (
              <Card
                key={order.id}
                className="overflow-hidden rounded-3xl border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md"
              >
                <CardHeader className="border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(order.createdAt).toLocaleDateString(
                            "fa-IR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-gray-400">
                        کد سفارش:{" "}
                        <span className="font-mono font-bold text-gray-900">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`gap-1.5 rounded-xl border-none px-4 py-1.5 text-sm font-bold ${statusInfo.color}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {statusInfo.text}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50 px-6">
                    {order.items.map((item) => {
                      const variant = item.productVariant;
                      const color = variant?.color;
                      const product = color?.product;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 py-6"
                        >
                          <div className="flex items-center gap-5">
                            {color?.mainImage && (
                              <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                                <Image
                                  src={color.mainImage}
                                  alt={product?.name || "Product"}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <h4 className="text-[16px] font-black leading-tight text-gray-900">
                                {product?.name || "محصول نامشخص"}
                              </h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                                <span className="flex items-center gap-1">
                                  رنگ: {color?.name || "نامشخص"}
                                </span>
                                <span className="text-gray-200">|</span>
                                <span>سایز: {variant?.size || "-"}</span>
                                <span className="text-gray-200">|</span>
                                <span>تعداد: {item.quantity}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-left">
                            <span className="text-[15px] font-black text-gray-900">
                              {(item.price * item.quantity).toLocaleString(
                                "fa-IR",
                              )}{" "}
                              <span className="text-[11px] font-bold text-gray-400">
                                تومان
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center justify-between gap-5 bg-gray-50/50 p-6 sm:flex-row">
                    <div className="w-full space-y-1 sm:w-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-500">
                          نحوه تسویه:
                        </span>
                        <span className="font-black text-gray-800">
                          {paymentTypeMap[
                            order.paymentType as keyof typeof paymentTypeMap
                          ] || order.paymentType}
                        </span>
                      </div>

                      {order.paymentType === "DEPOSIT" &&
                        order.status === "DEPOSIT_PAID" && (
                          <div className="flex items-center gap-2 rounded-lg border border-blue-100/50 bg-blue-50/50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                            <span>مانده قابل تسویه:</span>
                            <span>
                              {(totalAmount - depositAmount).toLocaleString(
                                "fa-IR",
                              )}{" "}
                              تومان
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-between gap-6 sm:w-auto">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold text-gray-400">
                          {isPendingPayment
                            ? "مبلغ کل فاکتور:"
                            : "مبلغ پرداخت شده:"}
                        </span>
                        <span
                          className={`text-xl font-black ${
                            isPendingPayment ? "text-gray-900" : "text-emerald-700"
                          }`}
                        >
                          {(isPendingPayment ? totalAmount : paidAmount).toLocaleString(
                            "fa-IR",
                          )}
                          <span className="mr-1 text-xs">تومان</span>
                        </span>
                      </div>

                      {isPendingPayment && (
                        <Button
                          asChild
                          className="h-11 rounded-xl bg-amber-500 font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600"
                        >
                          <Link
                            href={`/checkout/payment-mock?orderId=${order.id}`}
                          >
                            پرداخت فاکتور
                            <ChevronLeft className="mr-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
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
