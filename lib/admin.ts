// lib/admin.ts
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();

  console.log("[ADMIN AUTH CHECK]", {
    hasSession: Boolean(session),
    hasUser: Boolean(session?.user),
    email: session?.user?.email ?? null,
    role: session?.user?.role ?? null,
  });

  // اگر کاربر لاگین نکرده باشد
  if (!session?.user) {
    redirect("/login");
  }

  // اگر نقش کاربر ادمین نباشد
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}
