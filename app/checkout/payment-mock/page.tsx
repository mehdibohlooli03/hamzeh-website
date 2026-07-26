"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  XCircle,
  ShieldCheck,
} from "lucide-react";

import { useCart } from "@/store/useCart";
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

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCart((state) => state.clearCart);

  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState<"SUCCESS" | "FAILED" | null>(null);

  const shortOrderId = useMemo(() => {
    if (!orderId) return "";
    return orderId.length > 12
      ? `${orderId.slice(0, 6)}...${orderId.slice(-4)}`
      : orderId;
  }, [orderId]);

  const handlePayment = async (status: "SUCCESS" | "FAILED") => {
    if (!orderId) {
      toast.error("شناسه سفارش پیدا نشد");
      return;
    }

    setLoading(status);

    try {
      const response = await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "خطا در تایید پرداخت");
      }

      if (status === "SUCCESS") {
        toast.success("پرداخت با موفقیت انجام شد");
        clearCart();
        router.push(`/orders/success?orderId=${orderId}`);
        return;
      }

      toast.info("پرداخت لغو شد");
      router.push("/cart");
    } catch (error: any) {
      toast.error(error?.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(null);
    }
  };

  if (!orderId) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md border-gray-100 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
            <CardTitle className="text-2xl">سفارشی یافت نشد</CardTitle>
            <CardDescription>
              شناسه سفارش در آدرس صفحه وجود ندارد یا نامعتبر است.
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
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Payment Mock
            </Badge>
          </div>

          <CardTitle className="text-2xl font-bold">
            شبیه‌ساز درگاه پرداخت
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-gray-500">
            این صفحه فقط برای تست چرخه پرداخت ساخته شده است. می‌توانید پرداخت را
            موفق یا ناموفق شبیه‌سازی کنید.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">شناسه سفارش</span>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
            <div className="break-all rounded-xl bg-white px-4 py-3 font-mono text-sm font-semibold text-gray-900 ring-1 ring-gray-100">
              {orderId}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              نسخه کوتاه: <span className="font-mono">{shortOrderId}</span>
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <p>
                در صورت پرداخت موفق، سفارش به وضعیت نهایی تغییر می‌کند و به صفحه
                نتیجه هدایت می‌شوید.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <p>
                در صورت شکست یا انصراف، سفارش لغو شده و موجودی به انبار
                بازمی‌گردد.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="grid gap-3 p-6 pt-0">
          <Button
            className="h-12 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => handlePayment("SUCCESS")}
            disabled={loading !== null}
          >
            {loading === "SUCCESS"
              ? "در حال تایید پرداخت..."
              : "پرداخت موفق (شبیه‌سازی)"}
          </Button>

          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handlePayment("FAILED")}
            disabled={loading !== null}
          >
            {loading === "FAILED" ? "در حال لغو..." : "انصراف و بازگشت"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            onClick={() => router.back()}
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            بازگشت
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
        <div
          className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
          dir="rtl"
        >
          <div className="text-sm text-gray-500">در حال بارگذاری...</div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
