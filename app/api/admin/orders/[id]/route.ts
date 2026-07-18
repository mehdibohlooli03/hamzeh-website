import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status } = await req.json();
  const order = await prisma.order.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json(order);
}
