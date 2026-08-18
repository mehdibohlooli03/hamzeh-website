import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ colorId: string }>;
};

const ALLOWED_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

const variantSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1, "Size is required")
    .transform((value) => value.toUpperCase())
    .refine((value) => (ALLOWED_SIZES as readonly string[]).includes(value), {
      message: "Invalid size. Allowed values: S, M, L, XL, XXL",
    }),

  stock: z.coerce
    .number()
    .int("Stock must be a non-negative integer")
    .min(0, "Stock must be a non-negative integer"),
});

async function checkAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST(req: Request, context: RouteContext) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { colorId } = await context.params;

    if (!colorId) {
      return NextResponse.json(
        { error: "Color id is required" },
        { status: 400 },
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
          error: "Invalid request body",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { size, stock } = parsed.data;

    const color = await prisma.productColor.findUnique({
      where: { id: colorId },
      select: { id: true },
    });

    if (!color) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        colorId,
        size: size as any,
      },
      select: { id: true },
    });

    if (existingVariant) {
      return NextResponse.json(
        { error: "This size already exists for the selected color" },
        { status: 409 },
      );
    }

    const variant = await prisma.productVariant.create({
      data: {
        colorId,
        size: size as any,
        stock,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "This size already exists for the selected color" },
        { status: 409 },
      );
    }

    console.error("Create variant error:", error);

    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 },
    );
  }
}
