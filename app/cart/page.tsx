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

const isUnavailableStatus = (status?: ValidationStatus) => {
  return (
    status === "inactive" || status === "not_found" || status === "out_of_stock"
  );
};

export default function CartPage() {
  const router = useRouter();

  const items = useCart((state) => state.items);
  const removeItem = useCart((state) => state.removeItem);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const clearCart = useCart((state) => state.clearCart);
  const setItems = useCart((state) => state.setItems);
  const totalItems = useCart((state) => state.totalItems());

  const [isValidating, setIsValidating] = useState(false);
  const [validationMap, setValidationMap] = useState<
    Record<string, ValidationItem>
  >({});

  const validateCart = useCallback(async () => {
    if (items.length === 0) {
      setValidationMap({});
      return;
    }

    try {
      setIsValidating(true);

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

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const validation = validationMap[item.variantId];
      const isInvalid = isUnavailableStatus(validation?.status);
      const hasStockWarning = validation?.status === "insufficient_stock";

      const effectivePrice =
        typeof validation?.currentPrice === "number"
          ? validation.currentPrice
          : item.price;

      const effectiveStock =
        typeof validation?.availableStock === "number"
          ? validation.availableStock
          : item.stock;

      return {
        ...item,
        validation,
        isInvalid,
        hasStockWarning,
        effectivePrice,
        effectiveStock,
        lineTotal: effectivePrice * item.quantity,
      };
    });
  }, [items, validationMap]);

  const invalidItems = useMemo(() => {
    return enrichedItems.filter((item) => item.isInvalid);
  }, [enrichedItems]);

  const payableItems = useMemo(() => {
    return enrichedItems.filter((item) => !item.isInvalid);
  }, [enrichedItems]);

  const payableTotalPrice = useMemo(() => {
    return payableItems.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [payableItems]);

  const payableTotalItems = useMemo(() => {
    return payableItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [payableItems]);

  const hasInvalidItems = invalidItems.length > 0;
  const hasStockWarnings = enrichedItems.some(
    (item) => item.validation?.status === "insufficient_stock",
  );
  const isEmpty = items.length === 0;

  const handleCheckoutRedirect = () => {
    if (hasInvalidItems || isValidating) return;
    router.push("/checkout");
  };

  const handleRemoveInvalidItems = () => {
    invalidItems.forEach((item) => removeItem(item.variantId));
  };

  const handleIncrease = (
    variantId: string,
    quantity: number,
    stock: number,
  ) => {
    if (quantity >= stock) return;
    updateQuantity(variantId, quantity + 1);
  };

  const handleDecrease = (variantId: string, quantity: number) => {
    if (quantity <= 1) return;
    updateQuantity(variantId, quantity - 1);
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

        <div className="flex flex-wrap gap-3">
          {hasInvalidItems && (
            <Button
              variant="outline"
              onClick={handleRemoveInvalidItems}
              className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              حذف آیتم‌های نامعتبر
            </Button>
          )}

          <Button
            variant="outline"
            onClick={clearCart}
            className="h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            خالی کردن سبد
          </Button>
        </div>
      </div>

      {hasStockWarnings && !isValidating && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          تعداد بعضی از آیتم‌ها بر اساس موجودی فعلی فروشگاه اصلاح شده است.
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {enrichedItems.map((item) => {
            const validation = item.validation;
            const isInvalid = item.isInvalid;
            const hasStockWarning = item.hasStockWarning;

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
                          {item.effectiveStock.toLocaleString("fa-IR")}
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
                          {item.effectivePrice.toLocaleString("fa-IR")}
                          <span className="mr-1 text-sm font-normal text-gray-500">
                            تومان
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex w-fit items-center overflow-hidden rounded-xl border bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            handleIncrease(
                              item.variantId,
                              item.quantity,
                              item.effectiveStock,
                            )
                          }
                          disabled={
                            isInvalid ||
                            isValidating ||
                            item.quantity >= item.effectiveStock
                          }
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
                            handleDecrease(item.variantId, item.quantity)
                          }
                          disabled={isValidating || item.quantity <= 1}
                          className="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -
                        </button>
                      </div>

                      {/* پیام در حال بررسی اختصاصی برای هر محصول */}
                      {isValidating && (
                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 animate-pulse border border-blue-100">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          در حال بررسی موجودی...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-500">
                        جمع:
                        <span className="mr-1 font-bold text-black">
                          {item.lineTotal.toLocaleString("fa-IR")}
                        </span>
                        تومان
                      </p>

                      <Button
                        variant="outline"
                        onClick={() => removeItem(item.variantId)}
                        className="rounded-xl h-9 px-4 text-xs"
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
                <span className="text-gray-500">تعداد کل اقلام</span>
                <span className="font-medium">
                  {totalItems.toLocaleString("fa-IR")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">اقلام قابل پرداخت</span>
                <span className="font-medium">
                  {payableTotalItems.toLocaleString("fa-IR")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">مجموع قابل پرداخت</span>
                <span className="font-medium">
                  {payableTotalPrice.toLocaleString("fa-IR")} تومان
                </span>
              </div>

              <div className="h-px bg-gray-200" />

              <div className="flex items-center justify-between text-base font-bold">
                <span>مبلغ نهایی</span>
                <span>{payableTotalPrice.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>

            {hasInvalidItems && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                بعضی از آیتم‌های سبد خرید دیگر قابل سفارش نیستند. لطفاً آن‌ها را
                حذف کنید تا ادامه فرایند خرید فعال شود.
              </div>
            )}

            <Button
              onClick={handleCheckoutRedirect}
              disabled={hasInvalidItems || isValidating}
              className="mt-6 h-12 w-full rounded-xl text-base font-bold"
            >
              {isValidating ? "در حال بررسی..." : "ادامه فرایند خرید"}
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
