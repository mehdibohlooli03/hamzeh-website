"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBag, MapPin, CreditCard, Loader2 } from "lucide-react";

import { useCart } from "@/store/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  checkoutFormSchema,
  normalizeCheckoutFormInput,
  type PaymentType,
} from "@/lib/validations/checkout";

type FormData = {
  shippingAddress: string;
  postalCode: string;
  phone: string;
  paymentType: PaymentType;
};

type FieldErrors = Partial<Record<keyof FormData, string>>;
type TouchedFields = Partial<Record<keyof FormData, boolean>>;

const initialFormData: FormData = {
  shippingAddress: "",
  postalCode: "",
  phone: "",
  paymentType: "FULL",
};

const digitsMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (char) => digitsMap[char] ?? char);
}

function sanitizeDigitsOnly(value: string) {
  return toEnglishDigits(value).replace(/\D/g, "");
}

function sanitizeAddress(value: string) {
  return value.replace(/\s+/g, " ").trimStart();
}

export default function CheckoutPage() {
  const router = useRouter();

  const items = useCart((state) => state.items);
  const totalPrice = useCart((state) => state.totalPrice());

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});

  const addressRef = useRef<HTMLInputElement | null>(null);
  const postalCodeRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const totalItemsCount = useMemo(
    () => items.reduce((acc, curr) => acc + curr.quantity, 0),
    [items],
  );

  const depositAmount = useMemo(
    () => Math.round(totalPrice * 0.3),
    [totalPrice],
  );

  const payableAmount = useMemo(() => {
    return formData.paymentType === "FULL" ? totalPrice : depositAmount;
  }, [formData.paymentType, totalPrice, depositAmount]);

  const getFieldRef = (field: keyof FormData) => {
    switch (field) {
      case "shippingAddress":
        return addressRef;
      case "postalCode":
        return postalCodeRef;
      case "phone":
        return phoneRef;
      default:
        return null;
    }
  };

  const focusFirstInvalidField = (errors: FieldErrors) => {
    const fieldsOrder: (keyof FormData)[] = [
      "shippingAddress",
      "postalCode",
      "phone",
      "paymentType",
    ];

    const firstInvalidField = fieldsOrder.find((field) => !!errors[field]);

    if (!firstInvalidField) return;

    if (firstInvalidField === "paymentType") {
      return;
    }

    const fieldRef = getFieldRef(firstInvalidField);
    fieldRef?.current?.focus();
  };

  const validateForm = (values: FormData) => {
    const parsed = checkoutFormSchema.safeParse(values);

    if (parsed.success) {
      setFieldErrors({});
      return {
        success: true as const,
        data: parsed.data,
      };
    }

    const flattened = parsed.error.flatten().fieldErrors;

    const nextErrors: FieldErrors = {
      shippingAddress: flattened.shippingAddress?.[0],
      postalCode: flattened.postalCode?.[0],
      phone: flattened.phone?.[0],
      paymentType: flattened.paymentType?.[0],
    };

    setFieldErrors(nextErrors);

    return {
      success: false as const,
      errors: nextErrors,
    };
  };

  const validateSingleField = <K extends keyof FormData>(
    field: K,
    nextValues: FormData,
  ) => {
    const result = checkoutFormSchema.shape[field].safeParse(nextValues[field]);

    setFieldErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0]?.message,
    }));

    return result.success;
  };

  const normalizeFieldValue = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ): FormData[K] => {
    if (field === "postalCode") {
      return sanitizeDigitsOnly(String(value)).slice(0, 10) as FormData[K];
    }

    if (field === "phone") {
      return sanitizeDigitsOnly(String(value)).slice(0, 11) as FormData[K];
    }

    if (field === "shippingAddress") {
      return sanitizeAddress(String(value)) as FormData[K];
    }

    return value;
  };

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    const normalizedValue = normalizeFieldValue(field, value);

    const nextValues = {
      ...formData,
      [field]: normalizedValue,
    };

    setFormData(nextValues);

    if (fieldErrors[field] || touchedFields[field]) {
      validateSingleField(field, nextValues);
    }
  };

  const handleBlur = <K extends keyof FormData>(field: K) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    validateSingleField(field, formData);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center" dir="rtl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ShoppingBag className="h-8 w-8 text-gray-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-800">
          سبد خرید شما خالی است.
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          برای ثبت سفارش ابتدا محصولاتی را به سبد خرید خود اضافه کنید.
        </p>

        <Button
          onClick={() => router.push("/")}
          className="mt-6 h-11 rounded-xl bg-black text-white hover:bg-zinc-800"
        >
          بازگشت به فروشگاه
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const nextTouchedFields: TouchedFields = {
      shippingAddress: true,
      postalCode: true,
      phone: true,
      paymentType: true,
    };

    setTouchedFields(nextTouchedFields);

    const preparedValues: FormData = {
      shippingAddress: sanitizeAddress(formData.shippingAddress).trim(),
      postalCode: sanitizeDigitsOnly(formData.postalCode).slice(0, 10),
      phone: sanitizeDigitsOnly(formData.phone).slice(0, 11),
      paymentType: formData.paymentType,
    };

    setFormData(preparedValues);

    const validation = validateForm(preparedValues);

    if (!validation.success) {
      focusFirstInvalidField(validation.errors);
      toast.error("لطفاً خطاهای فرم را برطرف کنید.");
      return;
    }

    try {
      setLoading(true);

      const normalizedForm = normalizeCheckoutFormInput(validation.data);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          ...normalizedForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.fieldErrors) {
          const serverFieldErrors: FieldErrors = {
            shippingAddress: data.fieldErrors.shippingAddress,
            postalCode: data.fieldErrors.postalCode,
            phone: data.fieldErrors.phone,
            paymentType: data.fieldErrors.paymentType,
          };

          setFieldErrors((prev) => ({
            ...prev,
            ...serverFieldErrors,
          }));

          focusFirstInvalidField(serverFieldErrors);
        }

        throw new Error(data?.error || "خطا در ثبت سفارش");
      }

      if (!data?.orderId) {
        throw new Error("شناسه سفارش از سمت سرور دریافت نشد");
      }

      toast.success("سفارش شما با موفقیت ثبت شد.");
      router.push(`/checkout/payment-mock?orderId=${data.orderId}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "مشکلی در ثبت سفارش پیش آمد";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12" dir="rtl">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              نهایی‌سازی سفارش
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              لطفاً اطلاعات ارسال و شیوه پرداخت خود را وارد کنید.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-12"
          noValidate
        >
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-4">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  ۱. اطلاعات ارسال
                </h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-semibold text-gray-700"
                  >
                    آدرس دقیق پستی
                  </Label>
                  <Input
                    id="address"
                    ref={addressRef}
                    disabled={loading}
                    value={formData.shippingAddress}
                    onChange={(e) =>
                      handleChange("shippingAddress", e.target.value)
                    }
                    onBlur={() => handleBlur("shippingAddress")}
                    placeholder="استان، شهر، خیابان، پلاک، واحد..."
                    aria-invalid={!!fieldErrors.shippingAddress}
                    aria-describedby="shippingAddress-error"
                    className={`h-12 rounded-xl focus-visible:ring-black ${
                      fieldErrors.shippingAddress
                        ? "border-rose-400 focus-visible:ring-rose-500"
                        : "border-gray-200"
                    }`}
                  />
                  {fieldErrors.shippingAddress ? (
                    <p
                      id="shippingAddress-error"
                      className="text-xs font-medium text-rose-600"
                    >
                      {fieldErrors.shippingAddress}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      آدرس را کامل و دقیق وارد کنید تا ارسال بدون مشکل انجام شود.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="postalCode"
                      className="text-sm font-semibold text-gray-700"
                    >
                      کد پستی
                    </Label>
                    <Input
                      id="postalCode"
                      ref={postalCodeRef}
                      disabled={loading}
                      inputMode="numeric"
                      dir="ltr"
                      maxLength={10}
                      value={formData.postalCode}
                      onChange={(e) =>
                        handleChange("postalCode", e.target.value)
                      }
                      onBlur={() => handleBlur("postalCode")}
                      placeholder="۱۰ رقم بدون فاصله"
                      aria-invalid={!!fieldErrors.postalCode}
                      aria-describedby="postalCode-error"
                      className={`h-12 rounded-xl focus-visible:ring-black ${
                        fieldErrors.postalCode
                          ? "border-rose-400 focus-visible:ring-rose-500"
                          : "border-gray-200"
                      }`}
                    />
                    {fieldErrors.postalCode ? (
                      <p
                        id="postalCode-error"
                        className="text-xs font-medium text-rose-600"
                      >
                        {fieldErrors.postalCode}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        مثال: 1234567890
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-sm font-semibold text-gray-700"
                    >
                      شماره تماس همراه
                    </Label>
                    <Input
                      id="phone"
                      ref={phoneRef}
                      disabled={loading}
                      inputMode="tel"
                      dir="ltr"
                      maxLength={11}
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      onBlur={() => handleBlur("phone")}
                      placeholder="09..."
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby="phone-error"
                      className={`h-12 rounded-xl focus-visible:ring-black ${
                        fieldErrors.phone
                          ? "border-rose-400 focus-visible:ring-rose-500"
                          : "border-gray-200"
                      }`}
                    />
                    {fieldErrors.phone ? (
                      <p
                        id="phone-error"
                        className="text-xs font-medium text-rose-600"
                      >
                        {fieldErrors.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        شماره موبایل باید با 09 شروع شود.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 border-b pb-4">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  ۲. شیوه پرداخت
                </h2>
              </div>

              <RadioGroup
                value={formData.paymentType}
                onValueChange={(value: PaymentType) => {
                  if (loading) return;
                  handleChange("paymentType", value);
                }}
                className="space-y-4"
                disabled={loading}
              >
                <div
                  className={`flex cursor-pointer items-start space-x-3 space-x-reverse rounded-xl border p-4 transition-all duration-200 ${
                    formData.paymentType === "FULL"
                      ? "border-black bg-zinc-50/50 shadow-sm"
                      : "border-gray-100 hover:border-gray-200"
                  } ${loading ? "pointer-events-none opacity-50" : ""}`}
                  onClick={() => {
                    if (loading) return;
                    handleChange("paymentType", "FULL");
                  }}
                >
                  <RadioGroupItem
                    value="FULL"
                    id="full"
                    className="mt-1"
                    disabled={loading}
                  />
                  <Label
                    htmlFor="full"
                    className="flex flex-1 cursor-pointer flex-col gap-1 pr-1"
                  >
                    <span className="text-sm font-bold text-gray-900">
                      پرداخت کامل سفارش
                    </span>
                    <span className="text-xs text-gray-500">
                      تسویه کل مبلغ فاکتور به صورت آنلاین:{" "}
                      {totalPrice.toLocaleString("fa-IR")} تومان
                    </span>
                  </Label>
                </div>

                <div
                  className={`flex cursor-pointer items-start space-x-3 space-x-reverse rounded-xl border p-4 transition-all duration-200 ${
                    formData.paymentType === "DEPOSIT"
                      ? "border-black bg-zinc-50/50 shadow-sm"
                      : "border-gray-100 hover:border-gray-200"
                  } ${loading ? "pointer-events-none opacity-50" : ""}`}
                  onClick={() => {
                    if (loading) return;
                    handleChange("paymentType", "DEPOSIT");
                  }}
                >
                  <RadioGroupItem
                    value="DEPOSIT"
                    id="deposit"
                    className="mt-1"
                    disabled={loading}
                  />
                  <Label
                    htmlFor="deposit"
                    className="flex flex-1 cursor-pointer flex-col gap-1 pr-1"
                  >
                    <span className="text-sm font-bold text-gray-900">
                      پرداخت بیعانه (پیش‌پرداخت ۳۰٪)
                    </span>
                    <span className="text-xs text-gray-500">
                      پرداخت {depositAmount.toLocaleString("fa-IR")} تومان
                      بیعانه و تسویه مابقی در ادامه فرایند سفارش
                    </span>
                  </Label>
                </div>
              </RadioGroup>

              {fieldErrors.paymentType ? (
                <p className="mt-3 text-xs font-medium text-rose-600">
                  {fieldErrors.paymentType}
                </p>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-gray-900">
                خلاصه فاکتور
              </h3>

              <div className="space-y-3 border-b pb-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>تعداد اقلام:</span>
                  <span className="font-medium text-gray-900">
                    {totalItemsCount.toLocaleString("fa-IR")} عدد
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>جمع کل فاکتور:</span>
                  <span className="font-medium text-gray-900">
                    {totalPrice.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                {formData.paymentType === "DEPOSIT" && (
                  <div className="flex justify-between text-amber-600">
                    <span>پیش‌پرداخت (۳۰٪):</span>
                    <span className="font-medium">
                      {depositAmount.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                )}
              </div>

              <div className="my-4 flex items-center justify-between text-base font-bold text-gray-900">
                <span>مبلغ قابل پرداخت:</span>
                <span>{payableAmount.toLocaleString("fa-IR")} تومان</span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-xl bg-black font-bold text-white transition-transform active:scale-[0.98] hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    در حال ثبت اطلاعات...
                  </span>
                ) : (
                  "تایید و انتقال به درگاه"
                )}
              </Button>

              <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                با ثبت این سفارش قوانین و مقررات خرید غیرحضوری فروشگاه را
                می‌پذیرید.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
