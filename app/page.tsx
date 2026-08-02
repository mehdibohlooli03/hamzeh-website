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
  const groupedProducts = products.reduce<Record<string, Product[]>>(
    (acc, product) => {
      const cat = product.category || "سایر";
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(product);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <main
        className="flex min-h-[80vh] items-center justify-center bg-gray-50/50 px-4"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-black/10 opacity-75" />
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          </div>
          <p className="text-center text-sm font-medium text-gray-600">
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
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center shadow-xl shadow-red-500/5 sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            ⚠️
          </div>
          <h1 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">
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
    <div className="min-h-screen bg-gray-50/30 pb-14 sm:pb-20" dir="rtl">
      {/* 1. Hero Section */}
      <section className="relative isolate overflow-hidden bg-black">
        <div className="relative min-h-[580px] sm:min-h-[660px] lg:min-h-[720px]">
          <Image
            src="/LandingPoster.png"
            alt="کلکسیون جدید پوشاک حمزه"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/85 sm:bg-gradient-to-l sm:from-black/70 sm:via-black/45 sm:to-black/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.18),transparent_30%)]" />

          <div className="container relative z-10 mx-auto flex min-h-[580px] items-end px-4 py-10 sm:min-h-[660px] sm:items-center sm:py-16 lg:min-h-[720px] lg:py-24">
            <div className="w-full max-w-xl text-white sm:max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/95 shadow-lg shadow-black/20 backdrop-blur-md sm:mb-6 sm:px-4 sm:py-2 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>کلکسیون جدید تابستانه رسید</span>
              </div>

              <h1 className="max-w-[12ch] text-3xl font-extrabold leading-[1.25] tracking-tight sm:max-w-none sm:text-5xl sm:leading-[1.2] lg:text-7xl">
                استایل خاصت را
                <br />
                <span className="bg-gradient-to-l from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                  با حمزه کامل کن
                </span>
              </h1>

              <p className="mt-4 max-w-md text-sm leading-7 text-white/80 sm:mt-6 sm:max-w-xl sm:text-base sm:leading-8 lg:text-lg">
                ترکیبی از طراحی خاص، کیفیت بالا و حس لوکس برای کسانی که در
                انتخاب استایل، به جزئیات اهمیت می‌دهند.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  href="/products"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-2xl hover:shadow-amber-500/20 sm:w-auto sm:px-6"
                >
                  مشاهده همه محصولات
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>

                <Link
                  href="/products?sort=cheapest"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-white/35 hover:bg-white/15 sm:w-auto sm:px-6"
                >
                  شروع خرید
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:max-w-lg sm:grid-cols-3 sm:gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-base font-extrabold text-white sm:text-lg">
                    کیفیت
                  </p>
                  <p className="mt-1 text-xs leading-6 text-white/70 sm:text-sm">
                    دوخت تمیز و پارچه مرغوب
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-base font-extrabold text-white sm:text-lg">
                    استایل
                  </p>
                  <p className="mt-1 text-xs leading-6 text-white/70 sm:text-sm">
                    مینیمال، خاص و امروزی
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-base font-extrabold text-white sm:text-lg">
                    تنوع
                  </p>
                  <p className="mt-1 text-xs leading-6 text-white/70 sm:text-sm">
                    انتخاب برای هر سلیقه
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features/Trust Grid */}
      <section className="relative z-20 -mt-6 px-4 sm:-mt-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-xl shadow-neutral-100/70 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-2xl p-2 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 sm:h-12 sm:w-12">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">ارسال سریع</h3>
                <p className="mt-1 text-xs text-gray-500">به سراسر کشور</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl p-2 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">ضمانت اصالت</h3>
                <p className="mt-1 text-xs text-gray-500">۱۰۰٪ کیفیت برتر</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl p-2 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600 sm:h-12 sm:w-12">
                <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  ۷ روز ضمانت بازگشت
                </h3>
                <p className="mt-1 text-xs text-gray-500">با خیال راحت بخرید</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl p-2 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 sm:h-12 sm:w-12">
                <Headphones className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  پشتیبانی آنلاین
                </h3>
                <p className="mt-1 text-xs text-gray-500">در سریع‌ترین زمان</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Grid */}
      <section className="pt-10 sm:pt-12">
        <CategoryTypes />
      </section>

      {/* 4. Products Grouped by Categories (Horizontal Scroll) */}
      <section className="container mx-auto space-y-12 px-4 py-10 sm:space-y-16 sm:py-12">
        {Object.entries(groupedProducts).map(
          ([categoryName, categoryProducts]) => {
            const displayProducts = categoryProducts.slice(0, 4);
            const localizedTitle =
              categoryLabelMap[categoryName] || categoryName;

            const categorySlug = categorySlugMap[categoryName];
            const targetUrl = categorySlug
              ? `/products?category=${encodeURIComponent(categorySlug)}`
              : "/products";

            return (
              <div key={categoryName} className="space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black text-white sm:h-9 sm:w-9">
                      <Flame className="h-4 w-4" />
                    </div>
                    <h2 className="truncate text-lg font-black text-gray-900 sm:text-2xl">
                      {localizedTitle}
                    </h2>
                  </div>

                  <Link
                    href={targetUrl}
                    className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-gray-600 transition hover:text-black sm:text-sm"
                  >
                    مشاهده همه
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth sm:gap-6 sm:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                        className="group relative flex w-[78vw] max-w-[280px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/40 sm:w-[280px]"
                      >
                        <article className="flex h-full flex-col">
                          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-50">
                            {coverImage ? (
                              <Image
                                src={coverImage}
                                alt={`تصویر ${product.name}`}
                                fill
                                priority={false}
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                sizes="(max-width: 640px) 78vw, 280px"
                              />
                            ) : (
                              <div className="flex size-full flex-col items-center justify-center gap-2 text-gray-300">
                                <ShoppingBag className="h-10 w-10 stroke-1" />
                                <span className="text-xs">فاقد تصویر</span>
                              </div>
                            )}

                            <div className="absolute right-3 top-3 z-10">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-md ${
                                  isAvailable
                                    ? "bg-emerald-500/90 text-white"
                                    : "bg-rose-500/90 text-white"
                                }`}
                              >
                                {isAvailable ? "موجود" : "ناموجود"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col justify-between px-1 pb-2 pt-4">
                            <div className="space-y-1.5">
                              <h3 className="line-clamp-1 text-sm font-bold text-gray-900 transition-colors group-hover:text-amber-600 sm:text-[15px]">
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="line-clamp-1 text-[11px] leading-5 text-gray-400">
                                  {product.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 space-y-3">
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
                                    <span className="mr-0.5 text-[9px] font-medium text-gray-400">
                                      +{product.colors.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                                <span className="text-[10px] text-gray-400">
                                  قیمت
                                </span>
                                <div className="flex items-center gap-0.5">
                                  <span className="text-sm font-black text-gray-900 sm:text-[15px]">
                                    {Number(product.price).toLocaleString(
                                      "fa-IR",
                                    )}
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

                  <Link
                    href={targetUrl}
                    className="group flex w-[78vw] max-w-[280px] shrink-0 snap-start flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition-all hover:border-black hover:bg-white sm:w-[280px]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-900 shadow-md transition-transform group-hover:scale-110">
                      <ArrowLeft className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-black text-gray-900">
                      مشاهده بیشتر
                    </h3>
                    <p className="mt-1 text-xs leading-6 text-gray-500">
                      نمایش تمامی محصولات گروه {localizedTitle}
                    </p>
                  </Link>
                </div>
              </div>
            );
          },
        )}
      </section>
    </div>
  );
}
