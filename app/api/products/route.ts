import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const products = await prisma.product.findMany({
      where: {
        // ۱. فقط محصولات فعال
        isActive: true,

        // اگر category ارسال شده باشد، بر اساس آن فیلتر می‌شود
        ...(category ? { category } : {}),
      },

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },

        colors: {
          where: {
            // ۲. فقط رنگ‌های فعال
            isActive: true,
          },
          include: {
            variants: {
              where: {
                // ۳. فقط واریانت‌های فعال
                isActive: true,
              },
              orderBy: {
                size: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET_ERROR]:", error);

    return NextResponse.json(
      {
        error: "خطا در دریافت محصولات",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}
