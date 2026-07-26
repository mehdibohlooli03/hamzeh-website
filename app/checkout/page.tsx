// app/checkout/page.tsx
"use client";

import { useState } from "react";
import { useCart } from "@/store/useCart";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner"; // یا هر کتابخانه توست که داری

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    shippingAddress: "",
    postalCode: "",
    phone: "",
    paymentType: "FULL" as "FULL" | "DEPOSIT",
  });

  if (items.length === 0) {
    return <div className="p-20 text-center">سبد خرید شما خالی است.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success("سفارش با موفقیت ثبت شد. در حال انتقال به درگاه پرداخت...");
      // هدایت به درگاه شبیه‌ساز (در مرحله بعد می‌سازیم)
      router.push(`/checkout/payment-mock?orderId=${data.orderId}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10" dir="rtl">
      <h1 className="mb-8 text-2xl font-bold">اطلاعات ارسال و پرداخت</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>آدرس دقیق پستی</Label>
          <Input
            required
            value={formData.shippingAddress}
            onChange={(e) =>
              setFormData({ ...formData, shippingAddress: e.target.value })
            }
            placeholder="استان، شهر، خیابان..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>کد پستی</Label>
            <Input
              required
              value={formData.postalCode}
              onChange={(e) =>
                setFormData({ ...formData, postalCode: e.target.value })
              }
              placeholder="۱۰ رقم"
            />
          </div>
          <div className="space-y-2">
            <Label>شماره تماس</Label>
            <Input
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="۰۹..."
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
          <Label className="font-bold text-lg">نوع پرداخت</Label>
          <RadioGroup
            value={formData.paymentType}
            onValueChange={(v: "FULL" | "DEPOSIT") =>
              setFormData({ ...formData, paymentType: v })
            }
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="FULL" id="full" />
              <Label htmlFor="full" className="cursor-pointer">
                پرداخت کامل مبلغ ({totalPrice().toLocaleString()} تومان)
              </Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="DEPOSIT" id="deposit" />
              <Label htmlFor="deposit" className="cursor-pointer">
                پرداخت بیعانه (پیش‌پرداخت)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={loading}
        >
          {loading ? "در حال ثبت سفارش..." : "تایید و پرداخت نهایی"}
        </Button>
      </form>
    </div>
  );
}
