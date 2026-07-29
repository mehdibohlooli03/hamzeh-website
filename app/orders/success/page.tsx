"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/store/useCart";

interface OrderData {
  id: string;
  status: "PENDING" | "PAID" | "DEPOSIT_PAID" | "CANCELLED";
  paymentType: "FULL" | "DEPOSIT";
  totalAmount: number;
  depositAmount: number;
  createdAt: string | Date;
  depositDeadline?: string | Date | null;
}

const SUCCESS_STATUSES = new Set<OrderData["status"]>(["PAID", "DEPOSIT_PAID"]);
const FINAL_STATUSES = new Set<OrderData["status"]>([
  "PAID",
  "DEPOSIT_PAID",
  "CANCELLED",
]);

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const clearCartForOrder = useCart((state) => state.clearCartForOrder);
  const hasClearedCartForOrder = useCart(
    (state) => state.hasClearedCartForOrder,
  );

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError("شناسه سفارش نامعتبر است");
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const fetchOrder = async () => {
      const maxAttempts = 4;
      const retryDelay = 1000;

      setLoading(true);
      setError(null);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await fetch(
            `/api/orders/${orderId}?t=${Date.now()}&attempt=${attempt}`,
            {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
              headers: {
                Pragma: "no-cache",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            },
          );

          if (!response.ok) {
            throw new Error("سفارش یافت نشد");
          }

          const data = await response.json();

          if (isCancelled) return;

          const normalizedOrder: OrderData = {
            id: data.id,
            status: data.status,
            paymentType: data.paymentType,
            totalAmount: data.totalAmount ?? 0,
            depositAmount: data.depositAmount ?? 0,
            createdAt: data.createdAt,
            depositDeadline: data.depositDeadline ?? null,
          };

          setOrder(normalizedOrder);

          const isFinal = FINAL_STATUSES.has(normalizedOrder.status);
          const isLastAttempt = attempt === maxAttempts;

          if (isFinal || isLastAttempt) {
            setLoading(false);
            return;
          }

          // انتظار قبل از تلاش مجدد
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } catch (err) {
          if (controller.signal.aborted || isCancelled) return;

          console.error(`[ORDER_SUCCESS_PAGE_FETCH_ERROR] Attempt ${attempt}:`, err);
          
          if (attempt === maxAttempts) {
            setError("خطا در دریافت اطلاعات سفارش از سرور");
            setLoading(false);
            return;
          }

          // در صورت بروز خطا در تلاش‌های اولیه، بعد از تاخیر دوباره تلاش می‌کنیم
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    };

    fetchOrder();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [orderId]);

  // تخلیه سبد خرید تنها در صورتی که سفارش با موفقیت ثبت شده و قبلا خالی نشده باشد
  useEffect(() => {
    if (!orderId || !order) return;
    if (!SUCCESS_STATUSES.has(order.status)) return;
    if (hasClearedCartForOrder(orderId)) return;

    clearCartForOrder(orderId);
  }, [order, orderId, clearCartForOrder, hasClearedCartForOrder]);

  const isSuccessfulOrder = useMemo(() => {
    if (!order) return false;
    return SUCCESS_STATUSES.has(order.status);
  }, [order]);

  const paidAmount = useMemo(() => {
    if (!order) return 0;
    return order.status === "PAID" ? order.totalAmount : order.depositAmount;
  }, [order]);

  const remainingAmount = useMemo(() => {
    if (!order || order.paymentType !== "DEPOSIT") return 0;
    return Math.max(order.totalAmount - order.depositAmount, 0);
  }, [order]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderId || !order || error) {
    return (
      <div
        className="container mx-auto max-w-md px-4 py-20 text-center"
        dir="rtl"
      >
        <Card className="border-red-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">سفارش یافت نشد</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              {error ?? "متأسفانه اطلاعاتی از این سفارش در دسترس نیست."}
            </p>
          </CardContent>

          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/")}>
              بازگشت به فروشگاه
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isSuccessfulOrder) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12" dir="rtl">
        <Card className="overflow-hidden border-red-100 shadow-xl">
          <CardHeader className="border-b bg-red-50/50 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
              <XCircle className="h-12 w-12" />
            </div>

            <CardTitle className="text-2xl font-black text-gray-900">
              سفارش نهایی نشده است
            </CardTitle>

            <p className="text-muted-foreground">
              {order.status === "CANCELLED"
                ? "این سفارش لغو شده است."
                : "پرداخت این سفارش هنوز توسط سیستم تأیید نشده است."}
            </p>
          </CardHeader>

          <CardContent className="p-6 text-center">
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                شناسه سفارش:{" "}
                <span className="font-mono font-bold text-foreground">
                  {order.id}
                </span>
              </p>

              <p className="text-muted-foreground">
                وضعیت فعلی: <Badge variant="outline">{order.status}</Badge>
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 p-6 pt-0 sm:flex-row">
            <Button
              asChild
              className="h-12 w-full rounded-xl text-base font-bold"
            >
              <Link href="/cart">بازگشت به سبد خرید</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl text-base"
            >
              <Link href="/">صفحه اصلی</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12" dir="rtl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <h1 className="mb-2 text-3xl font-black text-gray-900">
          {order.status === "DEPOSIT_PAID"
            ? "بیعانه با موفقیت پرداخت شد!"
            : "پرداخت با موفقیت انجام شد!"}
        </h1>

        <p className="text-lg text-muted-foreground">
          {order.status === "DEPOSIT_PAID"
            ? "سفارش شما ثبت شد و در انتظار تسویه نهایی قرار گرفت."
            : "سفارش شما ثبت شد و در صف پردازش قرار گرفت."}
        </p>
      </div>

      <Card className="overflow-hidden border-gray-100 shadow-xl">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="font-bold text-gray-700">جزئیات سفارش</span>
            </div>

            <Badge variant="outline" className="font-mono">
              {order.id}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">وضعیت پرداخت</p>
              <Badge className="border-none bg-emerald-500 px-3 text-white">
                {order.status === "PAID" ? "تسویه کامل" : "بیعانه پرداخت شد"}
              </Badge>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-muted-foreground">نوع خرید</p>
              <p className="font-bold">
                {order.paymentType === "FULL" ? "نقدی" : "بیعانه‌ای"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">مبلغ پرداختی</p>
              <p className="text-lg font-black text-emerald-700">
                {paidAmount.toLocaleString("fa-IR")}{" "}
                <span className="text-xs">تومان</span>
              </p>
            </div>

            <div className="space-y-1 text-left">
              <p className="text-muted-foreground">تاریخ ثبت</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
          </div>

          {order.paymentType === "DEPOSIT" && (
            <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
              <p>
                مبلغ کل سفارش:{" "}
                <span className="font-bold">
                  {order.totalAmount.toLocaleString("fa-IR")} تومان
                </span>
              </p>

              <p>
                مانده قابل تسویه:{" "}
                <span className="font-bold">
                  {remainingAmount.toLocaleString("fa-IR")} تومان
                </span>
              </p>

              {order.depositDeadline && (
                <p>
                  مهلت تسویه:{" "}
                  <span className="font-bold">
                    {new Date(order.depositDeadline).toLocaleDateString(
                      "fa-IR",
                    )}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm leading-relaxed text-blue-800">
              {order.paymentType === "DEPOSIT"
                ? "همکاران ما به زودی جهت هماهنگی برای تسویه مابقی مبلغ با شما تماس خواهند گرفت."
                : "سفارش شما آماده بسته‌بندی است و از طریق پیامک اطلاع‌رسانی‌های بعدی انجام خواهد شد."}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 p-6 pt-0 sm:flex-row">
          <Button
            asChild
            className="h-12 w-full rounded-xl text-base font-bold"
          >
            <Link href="/orders">
              <ShoppingBag className="ml-2 h-5 w-5" />
              مشاهده سفارش‌های من
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl text-base"
          >
            <Link href="/">
              بازگشت به فروشگاه
              <ArrowRight className="mr-2 h-5 w-5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[60vh] items-center justify-center"
          dir="rtl"
        >
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
