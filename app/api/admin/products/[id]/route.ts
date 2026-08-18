import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z.string().trim().optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category: z.enum(["TSHIRT", "PANTS", "SHIRT", "JACKET"]),
  isActive: z.boolean().optional(),
});

async function ensureAdmin() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        colors: {
          orderBy: { createdAt: "asc" },
          include: {
            variants: {
              orderBy: { size: "asc" },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(`GET /api/admin/products/${id} failed:`, error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    let json: unknown;

    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = productSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        price: data.price,
        category: data.category,
        ...(typeof data.isActive === "boolean"
          ? { isActive: data.isActive }
          : {}),
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`PUT /api/admin/products/${id} failed:`, error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const unauthorized = await ensureAdmin();
    if (unauthorized) return unauthorized;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        colors: {
          select: {
            id: true,
            variants: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const colorIds = (product.colors as Array<{ id: string; variants: Array<{ id: string }> }>).map(
      (color) => color.id,
    );

    const variantIds = (product.colors as Array<{ id: string; variants: Array<{ id: string }> }>).flatMap(
      (color) => color.variants.map((variant) => variant.id),
    );

    let hasOrderDependencies = false;

    if (variantIds.length > 0) {
      const relatedOrderItems = await prisma.orderItem.count({
        where: {
          productVariantId: {
            in: variantIds,
          },
        },
      });

      if (relatedOrderItems > 0) {
        hasOrderDependencies = true;
      }
    }

    if (hasOrderDependencies) {
      await prisma.$transaction(async (tx: any) => {
        if (colorIds.length > 0) {
          await tx.productVariant.updateMany({
            where: {
              colorId: { in: colorIds },
            },
            data: {
              isActive: false,
            },
          });

          await tx.productColor.updateMany({
            where: {
              id: { in: colorIds },
            },
            data: {
              isActive: false,
            },
          });
        }

        await tx.product.update({
          where: { id },
          data: {
            isActive: false,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message:
          "محصول به دلیل داشتن سفارش‌های ثبت‌شده، غیرفعال (Soft Deleted) شد.",
        softDeleted: true,
      });
    }

    await prisma.$transaction(async (tx: any) => {
      if (colorIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            colorId: {
              in: colorIds,
            },
          },
        });

        await tx.productColor.deleteMany({
          where: {
            id: {
              in: colorIds,
            },
          },
        });
      }

      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      await tx.product.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "محصول و تمامی داده‌های وابسته با موفقیت حذف شدند.",
      softDeleted: false,
    });
  } catch (error: any) {
    console.error(`DELETE /api/admin/products/${id} failed:`, error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "خطای کلید خارجی: این محصول در سفارش‌ها استفاده شده و امکان حذف فیزیکی آن وجود ندارد.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
