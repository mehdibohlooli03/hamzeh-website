import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ابتدا وارد حساب کاربری خود شوید" },
        { status: 401 },
      );
    }

    const { orderId } = await context.params;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "شناسه سفارش نامعتبر است" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        paymentType: true,
        totalAmount: true,
        depositAmount: true,
        createdAt: true,
        depositDeadline: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "سفارش موردنظر پیدا نشد" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        id: order.id,
        status: order.status,
        paymentType: order.paymentType,
        totalAmount: order.totalAmount ?? 0,
        depositAmount: order.depositAmount ?? 0,
        createdAt: order.createdAt,
        depositDeadline: order.depositDeadline ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get Order Details Error:", error);

    return NextResponse.json(
      { error: "خطا در دریافت اطلاعات سفارش" },
      { status: 500 },
    );
  }
}
