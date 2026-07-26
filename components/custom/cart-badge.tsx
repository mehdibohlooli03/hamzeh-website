"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/store/useCart";

export function CartBadge() {
  const totalItems = useCart((state) => state.totalItems());
  const [mounted, setMounted] = useState(false);

  // این useEffect باعث می‌شود کامپوننت صبر کند تا در سمت کلاینت سوار (Mount) شود
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
      aria-label="سبد خرید"
    >
      <ShoppingCart className="h-5 w-5" />

      {/* 
          فقط اگر صفحه در کلاینت لود شده باشد (mounted) و آیتمی وجود داشته باشد، 
          عدد را نمایش می‌دهیم تا خطای Hydration برطرف شود.
      */}
      {mounted && totalItems > 0 && (
        <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {totalItems > 99 ? "99+" : totalItems.toLocaleString("fa-IR")}
        </span>
      )}
    </Link>
  );
}
