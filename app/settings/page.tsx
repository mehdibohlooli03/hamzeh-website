import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/custom/settings-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/settings");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return <div>کاربر یافت نشد.</div>;
  }

  return (
    <div className="container py-10" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">تنظیمات</h1>
        <p className="text-muted-foreground mt-2">
          اطلاعات شخصی و آدرس‌های خود را مدیریت کنید.
        </p>
      </div>

      <SettingsForm user={user} />
    </div>
  );
}
