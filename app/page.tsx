import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

import { ShoppingBag, ArrowLeft, Flame } from "lucide-react";
import CategoryTypes from "@/components/custom/category";
import LandingPooster from "@/components/custom/LandingPooster";

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

const categorySlugMap: Record<string, string> = {
  PANTS: "pants",
  TSHIRT: "tshirts",
  SHIRT: "shirts",
  JACKET: "hoodies",
};

const categoryLabelMap: Record<string, string> = {
  PANTS: "شلوار",
  TSHIRT: "تیشرت",
  SHIRT: "پیراهن",
  JACKET: "هودی و دورس",
};

async function getProducts(): Promise<{ products: Product[]; error: string }> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/products`, {
      method: "GET",
      cache: "no-store",
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const errorMessage =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : "خطا در دریافت محصولات";

      return { products: [], error: errorMessage };
    }

    if (!Array.isArray(data)) {
      return { products: [], error: "ساختار پاسخ API محصولات معتبر نیست" };
    }

    return { products: data as Product[], error: "" };
  } catch (error) {
    console.error("[HOME_PRODUCTS_FETCH_ERROR]:", error);

    return {
      products: [],
      error:
        error instanceof Error
          ? error.message
          : "خطا در دریافت محصولات از سرور",
    };
  }
}

export default async function HomePage() {
  const { products, error } = await getProducts();

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

          <Link
            href="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-black py-3 text-sm font-medium text-white transition-all hover:bg-gray-800"
          >
            تلاش دوباره
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-14 sm:pb-20" dir="rtl">
      {/* 1. Hero Section */}
      <LandingPooster />

      {/* 2. Category Grid */}
      <section className="pt-10 sm:pt-12">
        <CategoryTypes />
      </section>

      {/* 3. Products Grouped by Categories (Horizontal Scroll) */}
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

                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth sm:gap-6 sm:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
