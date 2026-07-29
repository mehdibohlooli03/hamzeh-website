"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreditCard, XCircle, ShieldCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderData {
  id: string;
  totalAmount: number | null;
  depositAmount: number | null;
  paymentType: "FULL" | "DEPOSIT";
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState<"SUCCESS" | "FAILED" | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [fetchingOrder, setFetchingOrder] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOrderDetails() {
      if (!orderId) {
        setFetchingOrder(false);
        return;
      }

      try {
        setFetchingOrder(true);

        const response = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("سفارش یافت نشد");
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        setOrderData({
          id: data.id,
          totalAmount: data.totalAmount ?? 0,
          depositAmount: data.depositAmount ?? 0,
          paymentType: data.paymentType,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Error fetching order:", error);
        setOrderData(null);
        toast.error("خطا در بارگذاری اطلاعات سفارش");
      } finally {
        if (!controller.signal.aborted) {
          setFetchingOrder(false);
        }
      }
    }

    fetchOrderDetails();

    return () => {
      controller.abort();
    };
  }, [orderId]);

  const totalAmount = useMemo(() => {
    return orderData?.totalAmount ?? 0;
  }, [orderData]);

  const depositAmount = useMemo(() => {
    return orderData?.depositAmount ?? 0;
  }, [orderData]);

  const payableAmount = useMemo(() => {
    if (!orderData) return 0;
    return orderData.paymentType === "DEPOSIT" ? depositAmount : totalAmount;
  }, [orderData, depositAmount, totalAmount]);

  const handlePayment = async (status: "SUCCESS" | "FAILED") => {
    if (!orderId) {
      toast.error("شناسه سفارش پیدا نشد");
      return;
    }

    if (loading !== null || fetchingOrder) return;

    setLoading(status);

    try {
      const response = await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "خطا در تایید وضعیت سفارش");
      }

      if (status === "SUCCESS") {
        toast.success(data?.message || "پرداخت با موفقیت انجام شد");
        router.replace(`/orders/success?orderId=${orderId}`);
        return;
      }

      toast.info(data?.message || "پرداخت ناموفق بود و سفارش لغو شد");
      router.replace("/cart");
    } catch (error: unknown) {
      console.error("Payment Mock Error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "خطا در برقراری ارتباط با درگاه";

      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  if (!orderId || (!fetchingOrder && !orderData)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md border-red-100 shadow-lg">
          <CardHeader className="text-center">
            <XCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
            <CardTitle>خطای دسترسی</CardTitle>
            <CardDescription>
              سفارش مورد نظر یافت نشد یا منقضی شده است.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/cart")}>
              بازگشت به سبد خرید
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-xl overflow-hidden border-gray-100 shadow-xl">
        <CardHeader className="border-b bg-white pb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
            <CreditCard className="h-8 w-8" />
          </div>

          <div className="mx-auto mb-3 flex items-center justify-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              محیط آزمایشی
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs italic"
            >
              Sandbox
            </Badge>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">
            شبیه‌ساز درگاه پرداخت
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50 py-6 text-center">
            <span className="mb-1 text-sm font-medium text-emerald-700">
              مبلغ قابل پرداخت:
            </span>

            <div className="flex items-baseline gap-1 text-emerald-900">
              <span className="text-4xl font-black">
                {fetchingOrder ? "..." : payableAmount.toLocaleString("fa-IR")}
              </span>
              <span className="text-sm font-bold">تومان</span>
            </div>

            {orderData?.paymentType === "DEPOSIT" && (
              <>
                <Badge className="mt-3 border-none bg-emerald-600 px-3 hover:bg-emerald-600">
                  قسط اول (بیعانه ۳۰٪)
                </Badge>

                <p className="mt-2 text-xs text-gray-600">
                  مبلغ کل سفارش: {totalAmount.toLocaleString("fa-IR")} تومان
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="mb-1 block text-[10px] uppercase text-gray-400">
                Order ID
              </span>
              <span className="block truncate text-xs font-mono font-bold">
                {orderId}
              </span>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <span className="mb-1 block text-[10px] text-gray-400">
                نوع پرداخت
              </span>
              <span className="block text-xs font-bold">
                {orderData?.paymentType === "DEPOSIT"
                  ? "پرداخت بیعانه"
                  : "تسویه کامل"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-600" />
              <div className="text-sm leading-relaxed text-blue-900">
                این یک درگاه تست است. با کلیک روی تایید، وضعیت سفارش شما
                {orderData?.paymentType === "DEPOSIT"
                  ? " به «بیعانه پرداخت شده» تغییر می‌کند."
                  : " به «پرداخت شده» تغییر می‌کند."}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="grid gap-3 p-6 pt-0">
          <Button
            className="h-12 w-full rounded-xl bg-emerald-600 text-base font-bold text-white shadow-sm hover:bg-emerald-700"
            onClick={() => handlePayment("SUCCESS")}
            disabled={loading !== null || fetchingOrder}
          >
            {loading === "SUCCESS" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "تایید و پرداخت موفق"
            )}
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-red-100 text-red-600 hover:bg-red-50"
            onClick={() => handlePayment("FAILED")}
            disabled={loading !== null || fetchingOrder}
          >
            {loading === "FAILED" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "لغو و بازگشت به سبد"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentMockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
