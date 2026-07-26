"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: {
  name: string;
  phone?: string;
  address?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "شما وارد حساب خود نشده‌اید." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      },
    });

    revalidatePath("/settings");
    return { success: "اطلاعات با موفقیت به‌روزرسانی شد." };
  } catch (error) {
    return { error: "خطایی در هنگام ذخیره‌سازی رخ داد." };
  }
}
