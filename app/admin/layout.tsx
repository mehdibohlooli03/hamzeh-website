import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 text-white p-4 space-y-2">
        <p className="font-bold text-lg mb-4">پنل ادمین</p>
        <Link href="/admin/products" className="block hover:text-gray-300">
          محصولات
        </Link>
        <Link href="/admin/orders" className="block hover:text-gray-300">
          سفارشات
        </Link>
        <Link href="/admin/users" className="block hover:text-gray-300">
          کاربران
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
