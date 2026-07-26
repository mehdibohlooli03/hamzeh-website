// app/checkout/payment-mock/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState(false);
  const clearCart = useCart((state) => state.clearCart);

  const handlePayment = async (status: "SUCCESS" | "FAILED") => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await response.json();

      if (status === "SUCCESS" && response.ok) {
        toast.success("پرداخت با موفقیت انجام شد");
        clearCart(); // خالی کردن سبد خرید پس از پرداخت موفق
        router.push(`/orders/success?orderId=${orderId}`);
      } else {
        toast.error("پرداخت ناموفق بود یا لغو شد");
        router.push("/cart"); // بازگشت به سبد خرید در صورت شکست
      }
    } catch (error) {
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return <div className="p-10 text-center">سفارشی یافت نشد.</div>;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
      dir="rtl"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            شبیه‌ساز درگاه پرداخت
          </CardTitle>
          <CardDescription>
            این یک صفحه تستی برای شبیه‌سازی عملیات بانکی است.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-sm text-blue-600">شناسه سفارش:</p>
            <p className="font-mono font-bold">{orderId}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handlePayment("SUCCESS")}
            disabled={loading}
          >
            پرداخت موفق (شبیه‌سازی)
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handlePayment("FAILED")}
            disabled={loading}
          >
            انصراف و بازگشت
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// استفاده از Suspense برای کلاینت کامپوننت‌هایی که از searchParams استفاده می‌کنند ضروری است
export default function PaymentMockPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
