import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { productVariant: { include: { color: { include: { product: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
