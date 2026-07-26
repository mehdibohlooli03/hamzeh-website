"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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

  if (loading) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center px-4"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="text-sm text-gray-500">در حال بارگذاری محصولات...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center px-4"
        dir="rtl"
      >
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <h1 className="mb-3 text-xl font-bold text-red-700">
            دریافت محصولات ناموفق بود
          </h1>

          <p className="text-sm leading-7 text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            تلاش دوباره
          </button>
        </div>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center px-4"
        dir="rtl"
      >
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold text-gray-800">
            محصولی پیدا نشد
          </h1>

          <p className="text-gray-500">
            در حال حاضر محصول فعالی برای نمایش وجود ندارد.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12" dir="rtl">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          محصولات فروشگاه
        </h1>

        <p className="mt-3 text-sm text-gray-500">
          جدیدترین محصولات فروشگاه را مشاهده کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          /*
           * اول تصویر اصلی خود محصول بررسی می‌شود.
           * اگر موجود نبود، تصویر اولین رنگ استفاده می‌شود.
           */
          const coverImage =
            product.images?.[0]?.url ??
            product.colors?.[0]?.mainImage ??
            null;

          /*
           * مجموع موجودی تمام سایزها و رنگ‌های محصول
           */
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
              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <article>
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt={`تصویر ${product.name}`}
                      fill
                      priority={false}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-2 text-gray-400">
                      <span className="text-4xl">📷</span>
                      <span className="text-sm">بدون تصویر</span>
                    </div>
                  )}

                  <div className="absolute right-3 top-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                        isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isAvailable ? "موجود" : "ناموجود"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h2 className="line-clamp-1 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                      {product.name}
                    </h2>

                    {product.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {product.colors?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">رنگ‌ها:</span>

                      <div className="flex items-center gap-1.5">
                        {product.colors.slice(0, 5).map((color) => (
                          <span
                            key={color.id}
                            title={color.name}
                            className="size-5 rounded-full border border-gray-300 shadow-sm"
                            style={{
                              backgroundColor: color.hexCode,
                            }}
                          />
                        ))}

                        {product.colors.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{product.colors.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm text-gray-400">قیمت:</span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-gray-900">
                        {Number(product.price).toLocaleString("fa-IR")}
                      </span>

                      <span className="text-xs text-gray-500">تومان</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
