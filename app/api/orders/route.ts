import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentType, OrderStatus } from "@prisma/client";
import { createOrderSchema } from "@/lib/validations/checkout";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب خود شوید" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsedBody = createOrderSchema.safeParse(body);

    if (!parsedBody.success) {
      const flattened = parsedBody.error.flatten().fieldErrors;

      return NextResponse.json(
        {
          error: "اطلاعات فرم معتبر نیست.",
          fieldErrors: {
            shippingAddress: flattened.shippingAddress?.[0],
            postalCode: flattened.postalCode?.[0],
            phone: flattened.phone?.[0],
            paymentType: flattened.paymentType?.[0],
            items: flattened.items?.[0],
          },
        },
        { status: 400 },
      );
    }

    const { items, shippingAddress, postalCode, phone, paymentType } =
      parsedBody.data;

    const mergedItemsMap = new Map<string, number>();

    for (const item of items) {
      const currentQty = mergedItemsMap.get(item.variantId) ?? 0;
      mergedItemsMap.set(item.variantId, currentQty + item.quantity);
    }

    const normalizedItems = Array.from(mergedItemsMap.entries()).map(
      ([variantId, quantity]) => ({
        variantId,
        quantity,
      }),
    );

    const variantIds = normalizedItems.map((item) => item.variantId);

    const newOrder = await prisma.$transaction(
      async (tx) => {
        let totalAmount = 0;
        const itemsToCreate: {
          productVariantId: string;
          quantity: number;
          price: number;
        }[] = [];

        const dbVariants = await tx.productVariant.findMany({
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

        for (const item of normalizedItems) {
          const variant = dbVariants.find((v) => v.id === item.variantId);

          if (!variant) {
            throw new Error("محصولی با مشخصات درخواستی یافت نشد.");
          }

          if (
            !variant.isActive ||
            !variant.color?.isActive ||
            !variant.color.product?.isActive
          ) {
            throw new Error(
              `محصول "${variant.color.product.name}" در حال حاضر غیرفعال است.`,
            );
          }

          if (variant.stock < item.quantity) {
            throw new Error(
              `موجودی سایز ${variant.size} برای محصول "${variant.color.product.name}" کافی نیست.`,
            );
          }

          const itemPrice = Number(variant.color.product.price ?? 0);

          if (itemPrice <= 0) {
            throw new Error(
              `قیمت محصول "${variant.color.product.name}" نامعتبر است.`,
            );
          }

          totalAmount += itemPrice * item.quantity;

          itemsToCreate.push({
            productVariantId: variant.id,
            quantity: item.quantity,
            price: itemPrice,
          });
        }

        const isDeposit = paymentType === "DEPOSIT";
        const depositAmount = isDeposit ? Math.round(totalAmount * 0.3) : null;
        const depositDeadline = isDeposit
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : null;

        const order = await tx.order.create({
          data: {
            userId: session.user.id,
            paymentType: isDeposit ? PaymentType.DEPOSIT : PaymentType.FULL,
            status: OrderStatus.PENDING,
            totalAmount,
            depositAmount,
            depositDeadline,
            shippingAddress,
            postalCode,
            phone,
            items: {
              create: itemsToCreate,
            },
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

        return order;
      },
      {
        maxWait: 10000,
        timeout: 25000,
      },
    );

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.id,
        status: newOrder.status,
        paymentType: newOrder.paymentType,
        totalAmount: newOrder.totalAmount ?? 0,
        depositAmount: newOrder.depositAmount ?? 0,
        depositDeadline: newOrder.depositDeadline ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ORDER_POST_ERROR]:", error);

    const message = error instanceof Error ? error.message : "خطا در ثبت سفارش";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
