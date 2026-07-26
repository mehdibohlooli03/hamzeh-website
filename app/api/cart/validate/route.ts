// app/api/cart/validate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CartValidateRequestItem = {
  variantId: string;
  quantity: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = body?.items as CartValidateRequestItem[] | undefined;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "فرمت آیتم‌های سبد خرید معتبر نیست" },
        { status: 400 },
      );
    }

    const variantIds = items
      .map((item) => item.variantId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (variantIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        color: {
          include: {
            product: true,
          },
        },
      },
    });

    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const result = items.map((item) => {
      const dbVariant = variantMap.get(item.variantId);

      if (!dbVariant) {
        return {
          variantId: item.variantId,
          status: "not_found" as const,
          isAvailable: false,
          availableStock: 0,
          currentPrice: null,
          requestedQuantity: item.quantity,
          validQuantity: 0,
          message: "این آیتم دیگر در دسترس نیست.",
        };
      }

      const isAvailable =
        dbVariant.isActive &&
        dbVariant.color.isActive &&
        dbVariant.color.product.isActive;

      if (!isAvailable) {
        return {
          variantId: item.variantId,
          status: "inactive" as const,
          isAvailable: false,
          availableStock: dbVariant.stock,
          currentPrice: dbVariant.price,
          requestedQuantity: item.quantity,
          validQuantity: 0,
          message: "این محصول دیگر برای سفارش فعال نیست.",
        };
      }

      const validQuantity = Math.max(0, Math.min(item.quantity, dbVariant.stock));

      if (dbVariant.stock < 1) {
        return {
          variantId: item.variantId,
          status: "out_of_stock" as const,
          isAvailable: false,
          availableStock: 0,
          currentPrice: dbVariant.price,
          requestedQuantity: item.quantity,
          validQuantity: 0,
          message: "موجودی این آیتم به اتمام رسیده است.",
        };
      }

      if (item.quantity > dbVariant.stock) {
        return {
          variantId: item.variantId,
          status: "insufficient_stock" as const,
          isAvailable: true,
          availableStock: dbVariant.stock,
          currentPrice: dbVariant.price,
          requestedQuantity: item.quantity,
          validQuantity,
          message: `موجودی این آیتم تغییر کرده و حداکثر ${dbVariant.stock} عدد قابل سفارش است.`,
        };
      }

      return {
        variantId: item.variantId,
        status: "ok" as const,
        isAvailable: true,
        availableStock: dbVariant.stock,
        currentPrice: dbVariant.price,
        requestedQuantity: item.quantity,
        validQuantity,
        message: null,
      };
    });

    return NextResponse.json({ items: result });
  } catch (error) {
    console.error("cart validate error:", error);

    return NextResponse.json(
      { error: "خطا در اعتبارسنجی سبد خرید" },
      { status: 500 },
    );
  }
}
