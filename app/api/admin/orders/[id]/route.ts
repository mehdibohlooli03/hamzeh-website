import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Order id is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const status = String(body.status || "").trim();

    if (!status) {
      return NextResponse.json(
        { error: "Order status is required" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Update admin order error:", error);

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
