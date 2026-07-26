// components/custom/user-menu.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut, Package, Settings, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type UserMenuProps = {
  name?: string | null;
};

export function UserMenu({ name }: UserMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 rounded-xl px-3 flex items-center gap-2 cursor-pointer select-none outline-none"
        )}
      >
        <UserCircle2 className="h-4 w-4" />
        <span className="max-w-[120px] truncate text-sm font-medium">
          {name || "حساب کاربری"}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56" dir="rtl">
        {/* به جای استفاده از Link و asChild، از رویداد onClick و router.push استفاده می‌کنیم */}
        <DropdownMenuItem 
          onClick={() => router.push("/orders")}
          className="flex w-full items-center gap-2 cursor-pointer text-right"
        >
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>سفارش‌های من</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => router.push("/settings")}
          className="flex w-full items-center gap-2 cursor-pointer text-right"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>تنظیمات</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer text-right"
        >
          <LogOut className="h-4 w-4" />
          <span>خروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
