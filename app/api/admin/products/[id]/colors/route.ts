import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const colorSchema = z.object({
  name: z.string().trim().min(1, "Color name is required"),
  hexCode: z
    .union([
      z.string().trim().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  mainImage: z
    .union([z.string().trim(), z.literal(""), z.null(), z.undefined()])
    .optional(),
});

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await context.params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product id is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = colorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, hexCode, mainImage } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const color = await prisma.productColor.create({
      data: {
        productId,
        name,
        hexCode: hexCode ? hexCode.trim() : null,
        mainImage: mainImage ? mainImage.trim() : null,
      },
    });

    return NextResponse.json(color, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This color already exists for the product" },
        { status: 409 },
      );
    }

    console.error("Create color error:", error);

    return NextResponse.json(
      { error: "Failed to create color" },
      { status: 500 },
    );
  }
}
