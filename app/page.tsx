"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowLeft,
  Sparkles,
  Flame,
} from "lucide-react";
import CategoryTypes from "@/components/custom/category";

interface ProductImage {
  id: string;
  url: string;
  order: number;
}

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  colorId: string;
}

interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
  mainImage: string | null;
  variants: ProductVariant[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  category: string;
  isActive: boolean;
  images: ProductImage[];
  colors: ProductColor[];
}

// نقشه‌نگاری مقادیر دیتابیس به Slugهای مورد انتظار در صفحه محصولات
const categorySlugMap: Record<string, string> = {
  PANTS: "pants",
  TSHIRT: "tshirts",
  SHIRT: "shirts",
  JACKET: "hoodies",
};

// نقشه‌نگاری مقادیر دیتابیس به نام‌های فارسی جهت نمایش شیک هدرها
const categoryLabelMap: Record<string, string> = {
  PANTS: "شلوار",
  TSHIRT: "تیشرت",
  SHIRT: "پیراهن",
  JACKET: "هودی و دورس",
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          const errorMessage =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "خطا در دریافت محصولات";

          throw new Error(errorMessage);
        }

        if (!Array.isArray(data)) {
          throw new Error("ساختار پاسخ API محصولات معتبر نیست");
        }

        setProducts(data as Product[]);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("[HOME_PRODUCTS_FETCH_ERROR]:", error);

        setError(
          error instanceof Error
            ? error.message
            : "خطا در دریافت محصولات از سرور",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      controller.abort();
    };
  }, []);

  // گروه‌بندی محصولات بر اساس دسته‌بندی دیتابیس
  const groupedProducts = products.reduce<Record<string, Product[]>>((acc, product) => {
    const cat = product.category || "سایر";
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(product);
    return acc;
  }, {});

  if (loading) {
    return (
      <main
        className="flex min-h-[80vh] items-center justify-center bg-gray-50/50 px-4"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-black/10 opacity-75"></div>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          </div>
          <p className="text-sm font-medium text-gray-600">
            در حال بارگذاری کلکسیون محصولات...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="flex min-h-[80vh] items-center justify-center bg-gray-50/50 px-4"
        dir="rtl"
      >
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-xl shadow-red-500/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            ⚠️
          </div>
          <h1 className="mb-3 text-xl font-bold text-gray-900">
            دریافت محصولات ناموفق بود
          </h1>
          <p className="text-sm leading-7 text-gray-500">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-2xl bg-black py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
          >
            تلاش دوباره
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20" dir="rtl">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-black"></div>
        <div className="container mx-auto px-4 py-20 sm:py-32 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>کلکسیون جدید تابستانه رسید!</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl leading-[1.2] sm:leading-[1.25] text-white">
              استایل خودت رو <br />
              <span className="bg-gradient-to-l from-amber-400 to-orange-400 bg-clip-text text-transparent">
                با حمزه بساز!
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-neutral-300 leading-8 max-w-lg">
              خاص‌ترین طراحی‌ها و پوشاک باکیفیت و تنوع بی‌نظیر برای کسانی که به
              جزئیات اهمیت می‌دهند. همین حالا خرید خود را آغاز کنید.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all hover:bg-neutral-100 hover:shadow-lg hover:shadow-white/10"
              >
                مشاهده همه محصولات
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features/Trust Grid */}
      <section className="container mx-auto px-4 -translate-y-8 relative z-20">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-gray-150 bg-white p-6 shadow-xl shadow-neutral-100/70 lg:grid-cols-4">
          <div className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">ارسال سریع</h3>
              <p className="text-xs text-gray-500 mt-1">به سراسر کشور</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">ضمانت اصالت</h3>
              <p className="text-xs text-gray-500 mt-1">۱۰۰٪ کیفیت برتر</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                ۷ روز ضمانت بازگشت
              </h3>
              <p className="text-xs text-gray-500 mt-1">با خیال راحت بخرید</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                پشتیبانی آنلاین
              </h3>
              <p className="text-xs text-gray-500 mt-1">در سریع‌ترین زمان</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Grid */}
      <CategoryTypes />

      {/* 4. Products Grouped by Categories (Horizontal Scroll) */}
      <section className="container mx-auto px-4 py-8 space-y-16">
        {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => {
          // فقط ۴ محصول اول
          const displayProducts = categoryProducts.slice(0, 4);

          // پیدا کردن معادل فارسی دسته‌بندی جهت نمایش هدر
          const localizedTitle = categoryLabelMap[categoryName] || categoryName;

          // بررسی Slug دسته‌بندی برای آدرس‌دهی فیلتر صفحه محصولات
          const categorySlug = categorySlugMap[categoryName];
          const targetUrl = categorySlug
            ? `/products?category=${encodeURIComponent(categorySlug)}`
            : "/products";

          return (
            <div key={categoryName} className="space-y-6">
              {/* هدر دسته‌بندی */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                    <Flame className="h-4 w-4" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 sm:text-2xl">
                    {localizedTitle}
                  </h2>
                </div>
                <Link
                  href={targetUrl}
                  className="group flex items-center gap-1.5 text-sm font-bold text-gray-600 transition hover:text-black"
                >
                  مشاهده همه
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>

              {/* اسکرول افقی بدون اسکرول‌بار مرئی */}
              <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {displayProducts.map((product) => {
                  const coverImage =
                    product.images?.[0]?.url ??
                    product.colors?.[0]?.mainImage ??
                    null;

                  const totalStock =
                    product.colors?.reduce((colorTotal, color) => {
                      const colorStock =
                        color.variants?.reduce(
                          (variantTotal, variant) =>
                            variantTotal + Math.max(variant.stock, 0),
                          0,
                        ) ?? 0;

                      return colorTotal + colorStock;
                    }, 0) ?? 0;

                  const isAvailable = totalStock > 0;

                  return (
                    <Link
                      href={`/products/${product.slug}`}
                      key={product.id}
                      className="group relative flex w-[280px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/40"
                    >
                      <article className="h-full flex flex-col">
                        {/* تصویر محصول */}
                        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-50">
                          {coverImage ? (
                            <Image
                              src={coverImage}
                              alt={`تصویر ${product.name}`}
                              fill
                              priority={false}
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              sizes="280px"
                            />
                          ) : (
                            <div className="flex size-full flex-col items-center justify-center gap-2 text-gray-300">
                              <ShoppingBag className="h-10 w-10 stroke-1" />
                              <span className="text-xs">فاقد تصویر</span>
                            </div>
                          )}

                          {/* برچسب موجودی */}
                          <div className="absolute right-3 top-3 z-10">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md shadow-sm ${
                                isAvailable
                                  ? "bg-emerald-500/90 text-white"
                                  : "bg-rose-500/90 text-white"
                              }`}
                            >
                              {isAvailable ? "موجود" : "ناموجود"}
                            </span>
                          </div>
                        </div>

                        {/* جزئیات محصول */}
                        <div className="flex flex-1 flex-col justify-between pt-4 pb-2 px-1">
                          <div className="space-y-1.5">
                            <h3 className="line-clamp-1 text-sm font-bold text-gray-900 transition-colors group-hover:text-amber-600">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="line-clamp-1 text-[11px] leading-5 text-gray-400">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 space-y-3">
                            {/* نمایش رنگ‌ها */}
                            {product.colors?.length > 0 && (
                              <div className="flex items-center gap-1">
                                {product.colors.slice(0, 4).map((color) => (
                                  <span
                                    key={color.id}
                                    title={color.name}
                                    className="h-3.5 w-3.5 rounded-full border border-white ring-1 ring-gray-200 shadow-sm"
                                    style={{
                                      backgroundColor: color.hexCode,
                                    }}
                                  />
                                ))}
                                {product.colors.length > 4 && (
                                  <span className="text-[9px] font-medium text-gray-400 mr-0.5">
                                    +{product.colors.length - 4}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* قیمت */}
                            <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                              <span className="text-[10px] text-gray-400">قیمت</span>
                              <div className="flex items-center gap-0.5">
                                <span className="text-sm font-black text-gray-900">
                                  {Number(product.price).toLocaleString("fa-IR")}
                                </span>
                                <span className="text-[9px] text-gray-500">
                                  تومان
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}

                {/* کارت پنجم (کلیک برای مشاهده همه محصولات این دسته‌بندی) */}
                <Link
                  href={targetUrl}
                  className="group flex w-[280px] shrink-0 snap-start flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition-all hover:border-black hover:bg-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-900 shadow-md group-hover:scale-110 transition-transform">
                    <ArrowLeft className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-black text-gray-900">
                    مشاهده بیشتر
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    نمایش تمامی محصولات گروه {localizedTitle}
                  </p>
                </Link>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
