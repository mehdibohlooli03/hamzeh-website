// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "لطفاً ابتدا وارد حساب خود شوید" }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, postalCode, phone, paymentType } = body;

    // ۱. بررسی ورودی‌ها
    if (!items || items.length === 0 || !shippingAddress || !phone) {
      return NextResponse.json({ error: "اطلاعات ارسال یا سبد خرید ناقص است" }, { status: 400 });
    }

    // استخراج شناسه‌های واریانت‌ها برای خواندن یکجای اطلاعات
    const variantIds = items.map((item: any) => item.variantId);

    // افزایش تایم‌اوت تراکنش به ۲۰ ثانیه و افزایش حداکثر زمان انتظار برای کانکشن
    const newOrder = await prisma.$transaction(
      async (tx) => {
        let totalAmount = 0;
        const itemsToCreate = [];

        // ۲. واکشی اطلاعات تمام واریانت‌ها به صورت یکجا برای افزایش سرعت و کاهش رفت‌وبرگشت به دیتابیس
        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          include: { 
            color: { 
              include: { 
                product: true 
              } 
            } 
          }
        });

        // ۳. بررسی وضعیت فعال بودن، موجودی و محاسبه قیمت
        for (const item of items) {
          const dbVariant = variants.find(v => v.id === item.variantId);

          if (!dbVariant) {
            throw new Error(`محصولی با مشخصات درخواستی یافت نشد`);
          }

          // بررسی فعال بودن محصول، رنگ و واریانت (Soft Delete)
          if (!dbVariant.isActive || !dbVariant.color.isActive || !dbVariant.color.product.isActive) {
            throw new Error(`محصول ${dbVariant.color.product.name} (سایز ${dbVariant.size}) دیگر در دسترس نیست و امکان سفارش آن وجود ندارد.`);
          }

          // بررسی موجودی
          if (dbVariant.stock < item.quantity) {
            throw new Error(`موجودی سایز ${dbVariant.size} برای محصول ${dbVariant.color.product.name} کافی نیست. موجودی فعلی: ${dbVariant.stock}`);
          }

          // محاسبه قیمت نهایی بر اساس قیمت دیتابیس
          const itemPrice = dbVariant.color.product.price;
          totalAmount += itemPrice * item.quantity;

          // کم کردن از موجودی انبار
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          });

          // آماده‌سازی آرایه برای ثبت در آیتم‌های سفارش
          itemsToCreate.push({
            productVariantId: item.variantId,
            quantity: item.quantity,
            price: itemPrice,
          });
        }

        // ۴. ثبت سفارش اصلی در دیتابیس
        const order = await tx.order.create({
          data: {
            userId: session.user.id!,
            paymentType,
            status: "PENDING_PAYMENT",
            totalAmount,
            shippingAddress,
            postalCode,
            phone,
            items: {
              create: itemsToCreate
            }
          }
        });

        return order;
      },
      {
        maxWait: 15000, // زمان انتظار برای گرفتن کانکشن تراکنش (۱۵ ثانیه)
        timeout: 25000, // زمان کل اجرای تراکنش (۲۵ ثانیه)
      }
    );

    return NextResponse.json({ orderId: newOrder.id }, { status: 201 });

  } catch (error: any) {
    console.error("[ORDER_POST_ERROR]:", error);
    // بازگرداندن خطای مناسب به کلاینت
    return NextResponse.json(
      { error: error.message || "خطا در ثبت سفارش" }, 
      { status: 400 } // تبدیل به استاتوس 400 برای نشان دادن خطاهای منطقی سبد خرید
    );
  }
}
