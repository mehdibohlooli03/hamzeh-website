"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBag, MapPin, CreditCard, ChevronLeft } from "lucide-react";

import { useCart } from "@/store/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function CheckoutPage() {
  const router = useRouter();
  
  const items = useCart((state) => state.items);
  const totalPrice = useCart((state) => state.totalPrice());
  const clearCart = useCart((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: "",
    postalCode: "",
    phone: "",
    paymentType: "FULL" as "FULL" | "DEPOSIT",
  });

  const depositAmount = Math.floor(totalPrice * 0.3);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center" dir="rtl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ShoppingBag className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">سبد خرید شما خالی است.</h2>
        <p className="mt-2 text-sm text-gray-500">برای ثبت سفارش ابتدا محصولاتی را به سبد خرید خود اضافه کنید.</p>
        <Button 
          onClick={() => router.push("/")}
          className="mt-6 h-11 rounded-xl bg-black text-white hover:bg-zinc-800"
        >
          بازگشت به فروشگاه
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ارتباط مستقیم با API اصلی ثبت سفارش
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity
          })),
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت سفارش");
      }

      toast.success("سفارش شما با موفقیت ثبت شد.");
      
      // هدایت به صفحه شبیه‌ساز پرداخت همراه با شناسه سفارش
      router.push(`/checkout/payment-mock?orderId=${data.orderId}`);
      
    } catch (error: any) {
      toast.error(error.message || "مشکلی در ثبت سفارش پیش آمد");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12" dir="rtl">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">نهایی‌سازی سفارش</h1>
            <p className="mt-1.5 text-sm text-gray-500">لطفاً اطلاعات ارسال و شیوه پرداخت خود را وارد کنید.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ستون فرم‌ها */}
          <div className="space-y-6 lg:col-span-8">
            {/* بخش آدرس */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-4">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">۱. اطلاعات ارسال</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-gray-700">آدرس دقیق پستی</Label>
                  <Input
                    id="address"
                    required
                    className="h-12 rounded-xl border-gray-200 focus-visible:ring-black"
                    value={formData.shippingAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, shippingAddress: e.target.value })
                    }
                    placeholder="استان، شهر، خیابان، پلاک، واحد..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-semibold text-gray-700">کد پستی</Label>
                    <Input
                      id="postalCode"
                      required
                      className="h-12 rounded-xl border-gray-200 focus-visible:ring-black"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      placeholder="۱۰ رقم بدون فاصله"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">شماره تماس همراه</Label>
                    <Input
                      id="phone"
                      required
                      className="h-12 rounded-xl border-gray-200 focus-visible:ring-black"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="۰۹..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* بخش شیوه پرداخت */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-4">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">۲. شیوه پرداخت</h2>
              </div>

              <RadioGroup
                value={formData.paymentType}
                onValueChange={(v: "FULL" | "DEPOSIT") =>
                  setFormData({ ...formData, paymentType: v })
                }
                className="space-y-4"
              >
                <div 
                  className={`flex items-start space-x-3 space-x-reverse rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                    formData.paymentType === "FULL" 
                      ? "border-black bg-zinc-50/50 shadow-sm" 
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                  onClick={() => setFormData({ ...formData, paymentType: "FULL" })}
                >
                  <RadioGroupItem value="FULL" id="full" className="mt-1" />
                  <Label htmlFor="full" className="flex flex-1 cursor-pointer flex-col gap-1 pr-1">
                    <span className="text-sm font-bold text-gray-900">پرداخت کامل سفارش</span>
                    <span className="text-xs text-gray-500">
                      تسویه کل مبلغ فاکتور به صورت آنلاین: {totalPrice.toLocaleString("fa-IR")} تومان
                    </span>
                  </Label>
                </div>

                <div 
                  className={`flex items-start space-x-3 space-x-reverse rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                    formData.paymentType === "DEPOSIT" 
                      ? "border-black bg-zinc-50/50 shadow-sm" 
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                  onClick={() => setFormData({ ...formData, paymentType: "DEPOSIT" })}
                >
                  <RadioGroupItem value="DEPOSIT" id="deposit" className="mt-1" />
                  <Label htmlFor="deposit" className="flex flex-1 cursor-pointer flex-col gap-1 pr-1">
                    <span className="text-sm font-bold text-gray-900">پرداخت بیعانه (پیش‌پرداخت ۳۰٪)</span>
                    <span className="text-xs text-gray-500">
                      پرداخت {depositAmount.toLocaleString("fa-IR")} تومان بیعانه و تسویه مابقی زمان تحویل
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* ستون فاکتور نهایی */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-gray-900">خلاصه فاکتور</h3>
              
              <div className="space-y-3 border-b pb-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>تعداد اقلام:</span>
                  <span className="font-medium text-gray-900">
                    {items.reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString("fa-IR")} عدد
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>جمع کل فاکتور:</span>
                  <span className="font-medium text-gray-900">{totalPrice.toLocaleString("fa-IR")} تومان</span>
                </div>
                {formData.paymentType === "DEPOSIT" && (
                  <div className="flex justify-between text-amber-600">
                    <span>پیش‌پرداخت (۳۰٪):</span>
                    <span className="font-medium">{depositAmount.toLocaleString("fa-IR")} تومان</span>
                  </div>
                )}
              </div>

              <div className="my-4 flex items-center justify-between text-base font-bold text-gray-900">
                <span>مبلغ قابل پرداخت:</span>
                <span>
                  {formData.paymentType === "FULL" 
                    ? totalPrice.toLocaleString("fa-IR") 
                    : depositAmount.toLocaleString("fa-IR")
                  } تومان
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-xl bg-black text-white hover:bg-zinc-800 font-bold transition-transform active:scale-[0.98]"
              >
                {loading ? "در حال ثبت اطلاعات..." : "تایید و انتقال به درگاه"}
              </Button>
              
              <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                با ثبت این سفارش قوانین و مقررات خرید غیرحضوری فروشگاه را می‌پذیرید.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
