import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
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

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    if (product.isActive) {
      return NextResponse.json({
        message: "Product is already active",
        product,
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Product restored successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("PATCH /api/admin/products/[id]/restore failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
