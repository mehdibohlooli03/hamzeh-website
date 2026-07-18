import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await prisma.product.findMany({
    include: { images: true, colors: { include: { variants: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: Number(data.price),
      category: data.category,
      isActive: data.isActive ?? true,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
