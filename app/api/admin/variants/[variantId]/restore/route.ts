import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ variantId: string }>;
};

async function ensureAdmin() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function PATCH(_req: Request, context: RouteContext) {
  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    const { variantId } = await context.params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        isActive: true,
        colorId: true,
        color: {
          select: {
            id: true,
            isActive: true,
            product: {
              select: {
                id: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { error: "واریانت مورد نظر پیدا نشد" },
        { status: 404 },
      );
    }

    if (!variant.color.product.isActive) {
      return NextResponse.json(
        { error: "ابتدا باید محصول اصلی را فعال کنید" },
        { status: 400 },
      );
    }

    if (!variant.color.isActive) {
      return NextResponse.json(
        { error: "ابتدا باید رنگ مربوطه را فعال کنید" },
        { status: 400 },
      );
    }

    if (variant.isActive) {
      return NextResponse.json({
        message: "واریانت از قبل فعال بوده است",
        variant: {
          id: variant.id,
          isActive: variant.isActive,
          colorId: variant.colorId,
        },
      });
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        isActive: true,
        colorId: true,
      },
    });

    return NextResponse.json({
      message: "واریانت با موفقیت بازگردانی شد",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/variants/[variantId]/restore failed:",
      error,
    );

    return NextResponse.json(
      { error: "خطا در بازگردانی واریانت" },
      { status: 500 },
    );
  }
}
