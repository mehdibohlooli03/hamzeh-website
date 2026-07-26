"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";

type ValidationStatus =
  | "ok"
  | "inactive"
  | "not_found"
  | "out_of_stock"
  | "insufficient_stock";

type ValidationItem = {
  variantId: string;
  status: ValidationStatus;
  isAvailable: boolean;
  availableStock: number;
  currentPrice: number | null;
  requestedQuantity: number;
  validQuantity: number;
  message: string | null;
};

export default function CartPage() {
  const router = useRouter();

  const items = useCart((state) => state.items);
  const removeItem = useCart((state) => state.removeItem);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const clearCart = useCart((state) => state.clearCart);
  const setItems = useCart((state) => state.setItems);
  const totalItems = useCart((state) => state.totalItems());
  const totalPrice = useCart((state) => state.totalPrice());

  const [isValidating, setIsValidating] = useState(false);
  const [validationMap, setValidationMap] = useState<
    Record<string, ValidationItem>
  >({});

  const validateCart = useCallback(async () => {
    if (items.length === 0) {
      setValidationMap({});
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const resultItems = (data.items ?? []) as ValidationItem[];

      const nextValidationMap = resultItems.reduce<
        Record<string, ValidationItem>
      >((acc, item) => {
        acc[item.variantId] = item;
        return acc;
      }, {});

      setValidationMap(nextValidationMap);

      let shouldSyncCart = false;

      const syncedItems = items.map((item) => {
        const validation = nextValidationMap[item.variantId];

        if (!validation) {
          return item;
        }

        let nextItem = item;

        if (
          typeof validation.currentPrice === "number" &&
          validation.currentPrice !== item.price
        ) {
          nextItem = {
            ...nextItem,
            price: validation.currentPrice,
          };
          shouldSyncCart = true;
        }

        if (validation.availableStock !== item.stock) {
          nextItem = {
            ...nextItem,
            stock: validation.availableStock,
          };
          shouldSyncCart = true;
        }

        if (
          validation.status === "insufficient_stock" &&
          validation.validQuantity > 0 &&
          validation.validQuantity !== item.quantity
        ) {
          nextItem = {
            ...nextItem,
            quantity: validation.validQuantity,
          };
          shouldSyncCart = true;
        }

        return nextItem;
      });

      if (shouldSyncCart) {
        setItems(syncedItems);
      }
    } catch (error) {
      console.error("cart validation error:", error);
    } finally {
      setIsValidating(false);
    }
  }, [items, setItems]);

  useEffect(() => {
    void validateCart();
  }, [validateCart]);

  const invalidVariantIds = useMemo(() => {
    return items
      .filter((item) => {
        const validation = validationMap[item.variantId];

        if (!validation) return false;

        return (
          validation.status === "inactive" ||
          validation.status === "not_found" ||
          validation.status === "out_of_stock"
        );
      })
      .map((item) => item.variantId);
  }, [items, validationMap]);

  const hasInvalidItems = invalidVariantIds.length > 0;
  const isEmpty = items.length === 0;

  const handleCheckoutRedirect = () => {
    if (hasInvalidItems || isValidating) return;
    router.push("/checkout");
  };

  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-12" dir="rtl">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-10 text-center shadow-sm">
          <h1 className="mb-4 text-2xl font-bold">سبد خرید شما خالی است</h1>
          <p className="mb-6 text-gray-500">
            هنوز محصولی به سبد خرید اضافه نکرده‌اید.
          </p>

          <Link href="/">
            <Button className="h-12 rounded-xl px-8 text-base font-bold">
              مشاهده محصولات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">سبد خرید</h1>
          <p className="mt-2 text-sm text-gray-500">
            {totalItems.toLocaleString("fa-IR")} آیتم در سبد خرید شما قرار دارد
          </p>
        </div>

        <Button
          variant="outline"
          onClick={clearCart}
          className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          خالی کردن سبد
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const validation = validationMap[item.variantId];
            const isInvalid =
              validation?.status === "inactive" ||
              validation?.status === "not_found" ||
              validation?.status === "out_of_stock";

            const hasStockWarning = validation?.status === "insufficient_stock";

            return (
              <div
                key={item.variantId}
                className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm sm:flex-row ${
                  isInvalid
                    ? "border-red-200 bg-red-50"
                    : hasStockWarning
                      ? "border-amber-200 bg-amber-50"
                      : "bg-white"
                }`}
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-28 w-full flex-shrink-0 overflow-hidden rounded-xl border bg-gray-50 sm:w-28"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      فاقد تصویر
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="line-clamp-2 text-lg font-bold hover:text-gray-700"
                        >
                          {item.name}
                        </Link>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span>سایز: {item.size}</span>
                          <span className="flex items-center gap-1">
                            رنگ:
                            <span>{item.colorName}</span>
                            {item.colorValue && (
                              <span
                                className="inline-block h-4 w-4 rounded-full border"
                                style={{ backgroundColor: item.colorValue }}
                              />
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-500">
                          موجودی قابل سفارش:{" "}
                          {item.stock.toLocaleString("fa-IR")}
                        </p>

                        {validation?.message && (
                          <p
                            className={`mt-2 text-sm font-medium ${
                              isInvalid
                                ? "text-red-600"
                                : hasStockWarning
                                  ? "text-amber-700"
                                  : "text-gray-500"
                            }`}
                          >
                            {validation.message}
                          </p>
                        )}
                      </div>

                      <div className="text-left">
                        <p className="text-lg font-bold text-black">
                          {item.price.toLocaleString("fa-IR")}
                          <span className="mr-1 text-sm font-normal text-gray-500">
                            تومان
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex w-fit items-center overflow-hidden rounded-xl border">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock || isInvalid}
                        className="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>

                      <span className="flex h-10 min-w-[48px] items-center justify-center border-x px-3 text-sm font-bold">
                        {item.quantity.toLocaleString("fa-IR")}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        disabled={isInvalid}
                        className="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        -
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">
                        جمع:
                        <span className="mr-1 font-bold text-black">
                          {(item.price * item.quantity).toLocaleString("fa-IR")}
                        </span>
                        تومان
                      </p>

                      <Button
                        variant="outline"
                        onClick={() => removeItem(item.variantId)}
                        className="rounded-xl"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold">خلاصه سفارش</h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">تعداد اقلام</span>
                <span className="font-medium">
                  {totalItems.toLocaleString("fa-IR")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">مجموع خرید</span>
                <span className="font-medium">
                  {totalPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div className="h-px bg-gray-200" />

              <div className="flex items-center justify-between text-base font-bold">
                <span>مبلغ قابل پرداخت</span>
                <span>{totalPrice.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            {hasInvalidItems && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                بعضی از آیتم‌های سبد خرید دیگر قابل سفارش نیستند. لطفاً آن‌ها را
                حذف کنید.
              </div>
            )}

            <Button
              onClick={handleCheckoutRedirect}
              disabled={hasInvalidItems || isValidating}
              className="mt-6 h-12 w-full rounded-xl text-base font-bold"
            >
              {isValidating ? "در حال بررسی سبد خرید..." : "ادامه فرایند خرید"}
            </Button>

            <Link href="/" className="mt-3 block">
              <Button variant="outline" className="h-12 w-full rounded-xl">
                بازگشت به فروشگاه
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
