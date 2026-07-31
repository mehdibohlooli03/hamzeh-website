"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShoppingBag, SlidersHorizontal } from "lucide-react";

type SortValue = "newest" | "cheapest" | "expensive";

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
  hexCode: string | null;
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

const categoryConfig: Record<
  string,
  {
    label: string;
    apiValue: string;
    description: string;
  }
> = {
  pants: {
    label: "شلوار",
    apiValue: "PANTS",
    description: "انواع شلوارهای جین، اسلش و استایل روز",
  },
  tshirts: {
    label: "تیشرت",
    apiValue: "TSHIRT",
    description: "تیشرت های راحت، خنک و مناسب استفاده روزمره",
  },
  shirts: {
    label: "پیراهن",
    apiValue: "SHIRT",
    description: "پیراهن های رسمی و اسپرت برای استایل کلاسیک",
  },
  hoodies: {
    label: "هودی و دورس",
    apiValue: "JACKET",
    description: "مدل های گرم، راحت و مناسب استایل خیابانی",
  },
};

const categoryLabelMap: Record<string, string> = {
  PANTS: "شلوار",
  TSHIRT: "تیشرت",
  SHIRT: "پیراهن",
  JACKET: "هودی و دورس",
};

function isSortValue(value: string | null): value is SortValue {
  return value === "newest" || value === "cheapest" || value === "expensive";
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get("category") ?? "";
  const sortParam = searchParams.get("sort");
  const sort: SortValue = isSortValue(sortParam) ? sortParam : "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedCategory = useMemo(() => {
    if (!categorySlug) return null;
    return categoryConfig[categorySlug] ?? null;
  }, [categorySlug]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (selectedCategory) {
          params.set("category", selectedCategory.apiValue);
        }

        if (sort !== "newest") {
          params.set("sort", sort);
        }

        const query = params.toString() ? `?${params.toString()}` : "";

        const response = await fetch(`/api/products${query}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "خطا در دریافت محصولات";

          throw new Error(message);
        }

        if (!Array.isArray(data)) {
          throw new Error("ساختار پاسخ محصولات معتبر نیست");
        }

        setProducts(data as Product[]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("[PRODUCTS_PAGE_FETCH_ERROR]:", err);

        setError(err instanceof Error ? err.message : "خطا در دریافت محصولات");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (categorySlug && !selectedCategory) {
      setProducts([]);
      setError("دسته بندی انتخاب شده معتبر نیست");
      setLoading(false);
      return;
    }

    fetchProducts();

    return () => controller.abort();
  }, [categorySlug, selectedCategory, sort]);

  const pageTitle = selectedCategory
    ? `محصولات دسته ${selectedCategory.label}`
    : "همه محصولات";

  const pageDescription = selectedCategory
    ? selectedCategory.description
    : "تمامی محصولات فعال فروشگاه را در این بخش مشاهده کنید.";

  const sortLabel =
    sort === "cheapest"
      ? "ارزان‌ترین"
      : sort === "expensive"
        ? "گران‌ترین"
        : "جدیدترین‌ها";

  function updateSort(nextSort: SortValue) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

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

  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      <section className="mb-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                {selectedCategory
                  ? "فیلتر براساس دسته بندی"
                  : "لیست کامل محصولات"}
              </span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">
              {pageTitle}
            </h1>

            <p className="mt-2 text-sm leading-7 text-gray-500">
              {pageDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white">
              {products.length.toLocaleString("fa-IR")} محصول
            </span>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
              <span className="text-xs font-semibold text-gray-500">
                مرتب‌سازی:
              </span>

              <select
                value={sort}
                onChange={(e) => updateSort(e.target.value as SortValue)}
                className="h-9 rounded-full bg-transparent px-3 text-xs font-bold text-gray-900 outline-none"
                aria-label="مرتب‌سازی محصولات"
              >
                <option value="newest">جدیدترین‌ها</option>
                <option value="cheapest">ارزان‌ترین</option>
                <option value="expensive">گران‌ترین</option>
              </select>
            </div>

            {selectedCategory && (
              <Link
                href={`/products${sort !== "newest" ? `?sort=${sort}` : ""}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black"
              >
                مشاهده همه محصولات
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 text-xs text-gray-400">
          نمایش بر اساس: <span className="font-semibold">{sortLabel}</span>
        </div>
      </section>

      {products.length === 0 ? (
        <section className="rounded-3xl border border-gray-100 bg-gray-50 px-6 py-16 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
              <ShoppingBag className="h-8 w-8" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              محصولی برای این دسته بندی پیدا نشد
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              {selectedCategory
                ? `در حال حاضر محصول فعالی در دسته ${selectedCategory.label} ثبت نشده است.`
                : "در حال حاضر محصول فعالی برای نمایش وجود ندارد."}
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              بازگشت به صفحه اصلی
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
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
            const categoryLabel =
              categoryLabelMap[product.category] ?? product.category;

            return (
              <Link
                href={`/products/${product.slug}`}
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50"
              >
                <article className="flex h-full flex-col">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-50">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={`تصویر ${product.name}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-300">
                        <ShoppingBag className="h-10 w-10 stroke-1" />
                        <span className="text-xs">فاقد تصویر محصول</span>
                      </div>
                    )}

                    <div className="absolute right-3 top-3 z-10">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm ${
                          isAvailable ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      >
                        {isAvailable ? "موجود" : "ناموجود"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between px-1 pb-2 pt-4">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-400">
                        {categoryLabel}
                      </span>

                      <h2 className="line-clamp-1 text-base font-bold text-gray-900 transition-colors group-hover:text-amber-600">
                        {product.name}
                      </h2>

                      {product.description ? (
                        <p className="line-clamp-2 text-xs leading-5 text-gray-400">
                          {product.description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300">
                          توضیحی برای این محصول ثبت نشده است.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-3.5">
                      {product.colors?.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {product.colors.slice(0, 4).map((color) => (
                            <span
                              key={color.id}
                              title={color.name}
                              className="h-4 w-4 rounded-full border border-white ring-1 ring-gray-200"
                              style={{
                                backgroundColor: color.hexCode ?? "#e5e7eb",
                              }}
                            />
                          ))}

                          {product.colors.length > 4 && (
                            <span className="mr-1 text-[10px] font-medium text-gray-400">
                              +{product.colors.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">قیمت</span>

                        <div className="flex items-center gap-1">
                          <span className="text-lg font-black text-gray-900">
                            {Number(product.price).toLocaleString("fa-IR")}
                          </span>
                          <span className="text-[10px] text-gray-500">
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
        </section>
      )}
    </main>
  );
}

function ProductsPageFallback() {
  return (
    <main
      className="flex min-h-[70vh] items-center justify-center px-4"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
        <p className="text-sm text-gray-500">در حال آماده‌سازی صفحه محصولات...</p>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}
