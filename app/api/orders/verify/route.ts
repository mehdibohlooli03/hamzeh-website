// app/api/orders/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, status } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order)
      return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });

    if (status === "SUCCESS") {
      // بروزرسانی وضعیت سفارش به پرداخت شده
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: order.paymentType === "FULL" ? "PAID" : "DEPOSIT_PAID",
        },
      });
      return NextResponse.json({ message: "سفارش با موفقیت نهایی شد" });
    } else {
      // اگر پرداخت ناموفق بود، موجودی انبار را برمی‌گردانیم
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        // وضعیت سفارش را به لغو شده تغییر می‌دهیم
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });
      });
      return NextResponse.json({ message: "سفارش لغو و موجودی اصلاح شد" });
    }
  } catch (error) {
    console.error("VERIFY_ERROR", error);
    return NextResponse.json({ error: "خطا در تایید سفارش" }, { status: 500 });
  }
}
