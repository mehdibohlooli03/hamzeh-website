import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ colorId: string }>;
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

    const { colorId } = await context.params;

    const color = await prisma.productColor.findUnique({
      where: { id: colorId },
      select: {
        id: true,
        isActive: true,
        productId: true,
        product: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!color) {
      return NextResponse.json(
        { error: "رنگ مورد نظر پیدا نشد" },
        { status: 404 },
      );
    }

    if (!color.product.isActive) {
      return NextResponse.json(
        { error: "ابتدا باید محصول اصلی را فعال کنید" },
        { status: 400 },
      );
    }

    if (color.isActive) {
      return NextResponse.json({
        message: "رنگ از قبل فعال بوده است",
        color: {
          id: color.id,
          isActive: color.isActive,
          productId: color.productId,
        },
      });
    }

    const updatedColor = await prisma.productColor.update({
      where: { id: colorId },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        isActive: true,
        productId: true,
      },
    });

    return NextResponse.json({
      message: "رنگ با موفقیت بازگردانی شد",
      color: updatedColor,
    });
  } catch (error) {
    console.error("PATCH /api/admin/colors/[colorId]/restore failed:", error);

    return NextResponse.json(
      { error: "خطا در بازگردانی رنگ" },
      { status: 500 },
    );
  }
}
