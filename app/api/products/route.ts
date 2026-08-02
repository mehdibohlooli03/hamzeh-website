import { NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SortParam = "cheapest" | "expensive";

const validCategories = new Set<Category>([
  Category.TSHIRT,
  Category.PANTS,
  Category.SHIRT,
  Category.JACKET,
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawCategory = searchParams.get("category");
    const rawSort = searchParams.get("sort");

    const category =
      rawCategory && validCategories.has(rawCategory as Category)
        ? (rawCategory as Category)
        : undefined;

    const sort: SortParam | undefined =
      rawSort === "cheapest" || rawSort === "expensive" ? rawSort : undefined;

    let orderBy: { price: "asc" | "desc" } | { createdAt: "asc" | "desc" } = {
      createdAt: "desc",
    };

    if (sort === "cheapest") {
      orderBy = { price: "asc" };
    } else if (sort === "expensive") {
      orderBy = { price: "desc" };
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
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
            isActive: true,
          },
          include: {
            variants: {
              where: {
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
      orderBy,
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
