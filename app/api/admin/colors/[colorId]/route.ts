import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ colorId: string }>;
};

const colorSchema = z.object({
  name: z.string().trim().min(1, "Color name is required"),
  hexCode: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  mainImage: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

async function ensureAdmin() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function PUT(req: Request, context: RouteContext) {
  const { colorId } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    if (!colorId) {
      return NextResponse.json(
        { error: "Color id is required" },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = colorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updatedColor = await prisma.productColor.update({
      where: { id: colorId },
      data: {
        name: parsed.data.name,
        hexCode: parsed.data.hexCode,
        mainImage: parsed.data.mainImage,
      },
    });

    return NextResponse.json(updatedColor);
  } catch (error) {
    console.error(`PUT /api/admin/colors/${colorId} failed:`, error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update color" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { colorId } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    if (!colorId) {
      return NextResponse.json(
        { error: "Color id is required" },
        { status: 400 }
      );
    }

    const color = await prisma.productColor.findUnique({
      where: { id: colorId },
      select: {
        id: true,
        variants: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!color) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    const variantIds = color.variants.map((variant) => variant.id);

    let hasOrderDependencies = false;

    if (variantIds.length > 0) {
      const relatedOrderItems = await prisma.orderItem.count({
        where: {
          productVariantId: {
            in: variantIds,
          },
        },
      });

      hasOrderDependencies = relatedOrderItems > 0;
    }

    if (hasOrderDependencies) {
      await prisma.$transaction(async (tx) => {
        if (variantIds.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: variantIds } },
            data: { isActive: false },
          });
        }

        await tx.productColor.update({
          where: { id: colorId },
          data: { isActive: false },
        });
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: "این رنگ به دلیل استفاده در سفارش‌ها غیرفعال شد.",
      });
    }

    await prisma.$transaction(async (tx) => {
      if (variantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: { colorId },
        });
      }

      await tx.productColor.delete({
        where: { id: colorId },
      });
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "رنگ با موفقیت حذف شد.",
    });
  } catch (error) {
    console.error(`DELETE /api/admin/colors/${colorId} failed:`, error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "این رنگ یا یکی از واریانت‌های آن در سفارش‌ها استفاده شده و قابل حذف نیست.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete color" },
      { status: 500 }
    );
  }
}
