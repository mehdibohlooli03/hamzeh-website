// app/admin/layout.tsx
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ArrowRightLeft,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // این خط امنیت پنل را تضمین می‌کند؛ اگر ادمین نباشد، ریدایرکت می‌شود.
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-muted/20" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-slate-50 p-6 flex flex-col gap-2">
        <div className="mb-8 border-b border-slate-800 pb-4 text-center">
          <p className="font-black text-xl tracking-tight text-primary-foreground">
            پنل مدیریت حمزه
          </p>
        </div>

        <nav className="space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <LayoutDashboard size={20} />
            <span>داشبورد</span>
          </Link>

          <Link
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <Package size={20} />
            <span>محصولات</span>
          </Link>

          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <ShoppingCart size={20} />
            <span>سفارشات</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <Users size={20} />
            <span>کاربران</span>
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
          >
            <ArrowRightLeft size={18} />
            <span>بازگشت به فروشگاه</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
