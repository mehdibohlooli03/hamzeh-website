import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { OrderStatus, PaymentType } from "@prisma/client";

type VerifyStatus = "SUCCESS" | "FAILED";

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function isFinalOrderStatus(status: string) {
  return (
    status === OrderStatus.PAID ||
    status === OrderStatus.DEPOSIT_PAID ||
    status === OrderStatus.CANCELLED
  );
}

function getPaidStatus(paymentType: PaymentType) {
  return paymentType === PaymentType.FULL
    ? OrderStatus.PAID
    : OrderStatus.DEPOSIT_PAID;
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ابتدا وارد حساب کاربری خود شوید" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const orderId = body?.orderId as string | undefined;
    const status = body?.status as VerifyStatus | undefined;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "شناسه سفارش الزامی است" },
        { status: 400 },
      );
    }

    if (status !== "SUCCESS" && status !== "FAILED") {
      return NextResponse.json(
        { error: "وضعیت پرداخت نامعتبر است" },
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
        depositDeadline: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "سفارش یافت نشد یا دسترسی غیرمجاز" },
        { status: 404 },
      );
    }

    if (isFinalOrderStatus(order.status)) {
      return NextResponse.json(
        {
          success: true,
          message: "این سفارش قبلاً تعیین تکلیف شده است",
          orderId: order.id,
          status: order.status,
          paymentType: order.paymentType,
          totalAmount: order.totalAmount ?? 0,
          depositAmount: order.depositAmount ?? 0,
          depositDeadline: order.depositDeadline ?? null,
        },
        { status: 200 },
      );
    }

    if (status === "FAILED") {
      const cancelledOrder = await prisma.$transaction(
        async (tx) => {
          const currentOrder = await tx.order.findFirst({
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
              depositDeadline: true,
            },
          });

          if (!currentOrder) {
            throw new ApiError("سفارش یافت نشد", 404);
          }

          if (isFinalOrderStatus(currentOrder.status)) {
            return currentOrder;
          }

          return await tx.order.update({
            where: {
              id: currentOrder.id,
            },
            data: {
              status: OrderStatus.CANCELLED,
            },
            select: {
              id: true,
              status: true,
              paymentType: true,
              totalAmount: true,
              depositAmount: true,
              depositDeadline: true,
            },
          });
        },
        {
          maxWait: 10000,
          timeout: 25000,
        },
      );

      return NextResponse.json(
        {
          success: false,
          message:
            cancelledOrder.status === OrderStatus.CANCELLED
              ? "پرداخت ناموفق بود و سفارش لغو شد"
              : "این سفارش قبلاً تعیین تکلیف شده است",
          orderId: cancelledOrder.id,
          status: cancelledOrder.status,
          paymentType: cancelledOrder.paymentType,
          totalAmount: cancelledOrder.totalAmount ?? 0,
          depositAmount: cancelledOrder.depositAmount ?? 0,
          depositDeadline: cancelledOrder.depositDeadline ?? null,
        },
        { status: 200 },
      );
    }

    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        const currentOrder = await tx.order.findFirst({
          where: {
            id: orderId,
            userId: session.user.id,
          },
          include: {
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                productVariantId: true,
              },
            },
          },
        });

        if (!currentOrder) {
          throw new ApiError("سفارش یافت نشد", 404);
        }

        if (isFinalOrderStatus(currentOrder.status)) {
          return await tx.order.findUniqueOrThrow({
            where: { id: currentOrder.id },
            select: {
              id: true,
              status: true,
              paymentType: true,
              totalAmount: true,
              depositAmount: true,
              depositDeadline: true,
            },
          });
        }

        if (!currentOrder.items.length) {
          throw new ApiError("این سفارش هیچ آیتمی ندارد و قابل نهایی‌سازی نیست.", 409);
        }

        const variantIds = currentOrder.items
          .map((item) => item.productVariantId)
          .filter((id): id is string => Boolean(id));

        if (variantIds.length !== currentOrder.items.length) {
          throw new ApiError(
            "شناسه تنوع محصول برای یکی از آیتم‌های سفارش نامعتبر است.",
            409,
          );
        }

        const variants = await tx.productVariant.findMany({
          where: {
            id: {
              in: variantIds,
            },
          },
          include: {
            color: {
              include: {
                product: true,
              },
            },
          },
        });

        for (const item of currentOrder.items) {
          const variant = variants.find((v) => v.id === item.productVariantId);

          if (!variant) {
            throw new ApiError("یکی از تنوع‌های محصول سفارش یافت نشد.", 409);
          }

          if (
            !variant.isActive ||
            !variant.color?.isActive ||
            !variant.color.product?.isActive
          ) {
            throw new ApiError(
              `محصول "${variant.color.product.name}" در حال حاضر غیرفعال است.`,
              409,
            );
          }

          if (variant.stock < item.quantity) {
            throw new ApiError(
              `موجودی سایز ${variant.size} برای محصول "${variant.color.product.name}" کافی نیست.`,
              409,
            );
          }
        }

        for (const item of currentOrder.items) {
          await tx.productVariant.update({
            where: {
              id: item.productVariantId as string,
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        const paidOrder = await tx.order.update({
          where: {
            id: currentOrder.id,
          },
          data: {
            status: getPaidStatus(currentOrder.paymentType),
          },
          select: {
            id: true,
            status: true,
            paymentType: true,
            totalAmount: true,
            depositAmount: true,
            depositDeadline: true,
          },
        });

        return paidOrder;
      },
      {
        maxWait: 10000,
        timeout: 25000,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "سفارش با موفقیت نهایی شد",
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        paymentType: updatedOrder.paymentType,
        totalAmount: updatedOrder.totalAmount ?? 0,
        depositAmount: updatedOrder.depositAmount ?? 0,
        depositDeadline: updatedOrder.depositDeadline ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[VERIFY_ORDER_ERROR]", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    const message =
      error instanceof Error ? error.message : "خطای سیستمی در تایید سفارش";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
