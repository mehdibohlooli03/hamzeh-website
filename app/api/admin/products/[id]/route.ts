import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: Number(data.price),
      category: data.category,
      isActive: data.isActive,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
