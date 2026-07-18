import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">داشبورد</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "محصولات", href: "/admin/products" },
          { label: "سفارشات", href: "/admin/orders" },
          { label: "کاربران", href: "/admin/users" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="p-6 border rounded-lg hover:bg-gray-50 text-center font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
