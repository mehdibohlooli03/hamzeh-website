import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        status: true,
        totalAmount: true,
        paymentType: true,
        phone: true,
        shippingAddress: true,
        postalCode: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            productVariant: {
              select: {
                size: true,
                color: {
                  select: {
                    name: true,
                    mainImage: true,
                    product: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    type OrderListItem = (typeof orders)[number];

    const formattedOrders = orders.map((order: OrderListItem) => ({
      ...order,
      address: order.shippingAddress,
    }));

    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
