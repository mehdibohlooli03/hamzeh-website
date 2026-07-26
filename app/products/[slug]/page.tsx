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

        const res = await fetch(`/api/products/${slug}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const data: unknown = await res.json();

        if (!res.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "خطا در دریافت محصول";

          throw new Error(message);
        }

        const productData = data as Product;

        setProduct(productData);

        const firstColor = productData.colors?.[0] ?? null;
        const firstProductImage = productData.images?.[0]?.url ?? "";
        const firstMainImage = firstColor?.mainImage ?? firstProductImage;

        setSelectedColor(firstColor);
        setSelectedVariant(null);
        setMainImage(firstMainImage);
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

    const images = product.images.map((image) => image.url);

    if (selectedColor?.mainImage && !images.includes(selectedColor.mainImage)) {
      return [selectedColor.mainImage, ...images];
    }

    return images;
  }, [product, selectedColor]);

  const availableVariants = selectedColor?.variants ?? [];

  const hasPurchasableVariant =
    product?.colors.some((color) =>
      color.variants.some((variant) => variant.stock > 0),
    ) ?? false;

  const handleColorChange = (color: ProductColor) => {
    setSelectedColor(color);
    setSelectedVariant(null);
    setMainImage(color.mainImage || product?.images?.[0]?.url || "");
  };

  const handleAddToCart = () => {
    if (!product || !selectedColor) return;

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
        image: mainImage || product.images?.[0]?.url || "",
      },
      1,
    );

    toast.success("به سبد خرید اضافه شد");
  };

  if (loading) {
    return (
      <div className="p-10 text-center font-vazir" dir="rtl">
        در حال بارگذاری...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center font-vazir text-red-600" dir="rtl">
        {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 text-center font-vazir" dir="rtl">
        محصول یافت نشد.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-gray-50">
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
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded border transition-all ${
                    mainImage === imageUrl
                      ? "ring-2 ring-black"
                      : "opacity-70 hover:opacity-100"
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
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>

          <p className="text-2xl font-semibold text-black">
            {Number(product.price).toLocaleString("fa-IR")}
            <span className="mr-2 text-sm font-normal">تومان</span>
          </p>

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

          {product.colors.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold">
                رنگ:
                <span className="mr-2 font-normal text-gray-500">
                  {selectedColor?.name || "انتخاب نشده"}
                </span>
              </h3>

              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${
                      selectedColor?.id === color.id
                        ? "scale-110 border-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.hexCode }}
                    title={color.name}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold">سایز:</h3>

            <div className="flex flex-wrap gap-2">
              {availableVariants.length > 0 ? (
                availableVariants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={variant.stock === 0}
                    onClick={() => setSelectedVariant(variant)}
                    className={`min-w-[64px] rounded-md border px-4 py-2 font-medium transition-all ${
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
            className="mt-4 h-14 w-full rounded-xl text-lg font-bold"
            disabled={!hasPurchasableVariant}
          >
            {hasPurchasableVariant ? "افزودن به سبد خرید" : "ناموجود"}
          </Button>
        </div>
      </div>
    </div>
  );
}
