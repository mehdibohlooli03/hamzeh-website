import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const variantSchema = z.object({
  size: z.enum(["S", "M", "L", "XL", "XXL"]),
  stock: z.coerce.number().int().min(0),
});

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

export async function PUT(req: Request, context: RouteContext) {
  const { variantId } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant id is required" },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = variantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, colorId: true },
    });

    if (!existingVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const duplicateVariant = await prisma.productVariant.findFirst({
      where: {
        colorId: existingVariant.colorId,
        size: parsed.data.size,
        NOT: { id: variantId },
      },
      select: { id: true },
    });

    if (duplicateVariant) {
      return NextResponse.json(
        { error: "A variant with this size already exists for this color" },
        { status: 409 }
      );
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        size: parsed.data.size,
        stock: parsed.data.stock,
      },
    });

    return NextResponse.json(updatedVariant);
  } catch (error: unknown) {
    console.error(`PUT /api/admin/variants/${variantId} failed:`, error);

    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { variantId } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant id is required" },
        { status: 400 }
      );
    }

    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true },
    });

    if (!existingVariant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const relatedOrderItems = await prisma.orderItem.count({
      where: { productVariantId: variantId },
    });

    if (relatedOrderItems > 0) {
      // Soft Delete: غیرفعال‌سازی واریانت
      const softDeletedVariant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "واریانت به دلیل استفاده در سفارش‌ها غیرفعال (Soft Deleted) شد.",
        variant: softDeletedVariant,
      });
    }

    // Hard Delete: حذف کامل فیزیکی به دلیل عدم وجود سفارش
    await prisma.productVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "واریانت با موفقیت به طور کامل حذف شد.",
    });
  } catch (error: unknown) {
    console.error(`DELETE /api/admin/variants/${variantId} failed:`, error);

    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    if ((error as { code?: string })?.code === "P2003") {
      return NextResponse.json(
        {
          error: "این واریانت در سفارش‌ها استفاده شده و امکان حذف فیزیکی آن وجود ندارد.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete variant" },
      { status: 500 }
    );
  }
}
