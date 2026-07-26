// app/orders/success/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container mx-auto px-4 py-20 text-center" dir="rtl">
      <CheckCircle2 className="mx-auto h-20 w-20 text-green-500" />
      <h1 className="mt-6 text-3xl font-bold">خرید شما با موفقیت انجام شد!</h1>
      <p className="mt-4 text-gray-600">
        شماره سفارش شما: <span className="font-mono font-bold">{orderId}</span>
      </p>
      <p className="mt-2 text-sm text-gray-500">
        فاکتور شما در حال پردازش است و به زودی ارسال خواهد شد.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Link href="/orders">
          <Button variant="outline">مشاهده سفارش‌های من</Button>
        </Link>
        <Link href="/">
          <Button>بازگشت به فروشگاه</Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
