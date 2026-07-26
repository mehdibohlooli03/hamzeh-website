"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";

interface Variant {
  id: string;
  size: string;
  stock: number;
}

interface ProductImage {
  id: string;
  url: string;
  order?: number;
}

interface ProductColor {
  id: string;
  name: string;
  hexCode: string;
  mainImage: string | null;
  variants: Variant[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  images: ProductImage[];
  colors: ProductColor[];
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [mainImage, setMainImage] = useState("");

  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/products/${slug}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "خطا در دریافت محصول";

          throw new Error(message);
        }

        if (!data || typeof data !== "object") {
          throw new Error("اطلاعات محصول معتبر نیست");
        }

        const productData = data as Product;

        setProduct(productData);

        const firstColorWithStock =
          productData.colors.find((color) =>
            color.variants.some((variant) => variant.stock > 0),
          ) ?? null;

        const fallbackColor = firstColorWithStock ?? productData.colors[0] ?? null;

        const fallbackProductImage = productData.images?.[0]?.url ?? "";
        const fallbackMainImage =
          fallbackColor?.mainImage ?? fallbackProductImage ?? "";

        setSelectedColor(fallbackColor);
        setSelectedVariant(null);
        setMainImage(fallbackMainImage);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("[PRODUCT_PAGE_FETCH_ERROR]", err);

        setError(err instanceof Error ? err.message : "خطا در دریافت محصول");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      fetchProduct();
    }

    return () => controller.abort();
  }, [slug]);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const images = product.images
      .map((image) => image.url)
      .filter((url) => typeof url === "string" && url.length > 0);

    if (
      selectedColor?.mainImage &&
      !images.includes(selectedColor.mainImage)
    ) {
      return [selectedColor.mainImage, ...images];
    }

    return images;
  }, [product, selectedColor]);

  const availableVariants = selectedColor?.variants ?? [];

  const hasPurchasableVariant =
    product?.colors.some((color) =>
      color.variants.some((variant) => variant.stock > 0),
    ) ?? false;

  const selectedVariantInStock =
    !!selectedVariant && selectedVariant.stock > 0;

  const handleColorChange = (color: ProductColor) => {
    setSelectedColor(color);
    setSelectedVariant(null);
    setMainImage(color.mainImage || product?.images?.[0]?.url || "");
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedColor) {
      toast.error("برای این محصول رنگی قابل انتخاب نیست");
      return;
    }

    if (!selectedVariant) {
      toast.error("لطفاً ابتدا سایز را انتخاب کنید");
      return;
    }

    if (selectedVariant.stock < 1) {
      toast.error("این سایز ناموجود است");
      return;
    }

    addItem(
      {
        id: crypto.randomUUID(),
        productId: product.id,
        variantId: selectedVariant.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        stock: selectedVariant.stock,
        size: selectedVariant.size,
        colorName: selectedColor.name,
        colorValue: selectedColor.hexCode,
        image:
          mainImage ||
          selectedColor.mainImage ||
          product.images?.[0]?.url ||
          "",
      },
      1,
    );

    toast.success("به سبد خرید اضافه شد");
  };

  const addToCartDisabled =
    !product ||
    !selectedColor ||
    availableVariants.length === 0 ||
    !selectedVariantInStock;

  const addToCartLabel = !product
    ? "در حال بارگذاری"
    : !hasPurchasableVariant
      ? "ناموجود"
      : !selectedColor
        ? "رنگی برای انتخاب وجود ندارد"
        : availableVariants.length === 0
          ? "برای این رنگ سایزی ثبت نشده"
          : !selectedVariant
            ? "ابتدا سایز را انتخاب کنید"
            : selectedVariant.stock < 1
              ? "ناموجود"
              : "افزودن به سبد خرید";

  if (loading) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center px-4"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-500">در حال بارگذاری محصول...</p>
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
            دریافت محصول ناموفق بود
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

  if (!product) {
    return (
      <main
        className="flex min-h-[70vh] items-center justify-center px-4"
        dir="rtl"
      >
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold text-gray-800">
            محصول یافت نشد
          </h1>

          <p className="text-gray-500">
            این محصول وجود ندارد یا در حال حاضر قابل نمایش نیست.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10" dir="rtl">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <section className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                فاقد تصویر
              </div>
            )}
          </div>

          {galleryImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {galleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setMainImage(imageUrl)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                    mainImage === imageUrl
                      ? "border-black ring-2 ring-black"
                      : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt={`${product.name}-${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {product.name}
            </h1>

            <p className="text-2xl font-bold text-gray-900">
              {Number(product.price).toLocaleString("fa-IR")}
              <span className="mr-2 text-sm font-normal text-gray-500">
                تومان
              </span>
            </p>
          </div>

          <div className="h-px bg-gray-200" />

          {product.description ? (
            <p className="text-justify leading-8 text-gray-600">
              {product.description}
            </p>
          ) : (
            <p className="text-gray-400">
              توضیحاتی برای این محصول ثبت نشده است.
            </p>
          )}

          {product.colors.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-bold text-gray-900">
                رنگ:
                <span className="mr-2 font-normal text-gray-500">
                  {selectedColor?.name || "انتخاب نشده"}
                </span>
              </h2>

              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  const colorHasStock = color.variants.some(
                    (variant) => variant.stock > 0,
                  );

                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                        selectedColor?.id === color.id
                          ? "scale-110 border-black"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                      title={color.name}
                      aria-label={color.name}
                    >
                      {!colorHasStock && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-black/70">
                          ×
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
              برای این محصول هنوز رنگی ثبت نشده است.
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">سایز:</h2>

            <div className="flex flex-wrap gap-2">
              {availableVariants.length > 0 ? (
                availableVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={variant.stock === 0}
                    onClick={() => setSelectedVariant(variant)}
                    className={`min-w-[64px] rounded-lg border px-4 py-2 font-medium transition-all ${
                      selectedVariant?.id === variant.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-black hover:border-black"
                    } ${
                      variant.stock === 0
                        ? "cursor-not-allowed bg-gray-100 opacity-40"
                        : ""
                    }`}
                  >
                    {variant.size}
                  </button>
                ))
              ) : (
                <span className="text-sm text-gray-400">
                  برای این رنگ سایزی ثبت نشده است.
                </span>
              )}
            </div>
          </div>

          {selectedVariant && (
            <p className="text-sm text-gray-500">
              موجودی این سایز: {selectedVariant.stock}
            </p>
          )}

          <Button
            onClick={handleAddToCart}
            className="mt-4 h-14 w-full rounded-xl text-base font-bold"
            disabled={addToCartDisabled}
          >
            {addToCartLabel}
          </Button>
        </section>
      </div>
    </main>
  );
}
