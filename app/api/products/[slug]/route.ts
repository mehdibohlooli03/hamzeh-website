import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "slug الزامی است" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
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
    });

    if (!product) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 },
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[API_PRODUCTS_SLUG_GET_ERROR]", error);

    return NextResponse.json(
      { error: "خطا در دریافت محصول" },
      { status: 500 },
    );
  }
}
