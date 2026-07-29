"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownWideNarrow,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  User2,
  WalletCards,
  XCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

const STATUSES = [
  "PENDING_PAYMENT",
  "DEPOSIT_PAID",
  "PAID",
  "SHIPPED",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELLED",
  "EXPIRED",
] as const;

const FILTER_OPTIONS = ["ALL", ...STATUSES] as const;

type StatusType = (typeof STATUSES)[number];
type FilterType = (typeof FILTER_OPTIONS)[number];
type SortType = "NEWEST" | "OLDEST" | "PRICE_DESC" | "PRICE_ASC";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  productVariant: {
    size: string;
    color: {
      name: string;
      mainImage?: string | null;
      product: {
        name: string;
      };
    };
  };
};

type Order = {
  id: string;
  status: StatusType | string;
  totalAmount: number;
  paymentType: string;
  phone?: string | null;
  address?: string | null;
  shippingAddress?: string | null;
  postalCode?: string | null;
  createdAt?: string;
  user: {
    name: string | null;
    email: string | null;
  };
  items: OrderItem[];
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

const SUCCESS_STATUSES = [
  "DEPOSIT_PAID",
  "PAID",
  "SHIPPED",
  "READY_FOR_PICKUP",
  "DELIVERED",
];

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "در انتظار پرداخت";
    case "DEPOSIT_PAID":
      return "بیعانه پرداخت شده";
    case "PAID":
      return "پرداخت کامل";
    case "SHIPPED":
      return "ارسال شده";
    case "READY_FOR_PICKUP":
      return "آماده تحویل";
    case "DELIVERED":
      return "تحویل شده";
    case "CANCELLED":
      return "لغو شده";
    case "EXPIRED":
      return "منقضی شده";
    case "ALL":
      return "همه سفارش‌ها";
    default:
      return status;
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };
    case "DEPOSIT_PAID":
      return {
        badge: "border-sky-200 bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
      };
    case "PAID":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "SHIPPED":
      return {
        badge: "border-violet-200 bg-violet-50 text-violet-700",
        dot: "bg-violet-500",
      };
    case "READY_FOR_PICKUP":
      return {
        badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
        dot: "bg-indigo-500",
      };
    case "DELIVERED":
      return {
        badge: "border-green-200 bg-green-50 text-green-700",
        dot: "bg-green-500",
      };
    case "CANCELLED":
      return {
        badge: "border-rose-200 bg-rose-50 text-rose-700",
        dot: "bg-rose-500",
      };
    case "EXPIRED":
      return {
        badge: "border-zinc-200 bg-zinc-100 text-zinc-700",
        dot: "bg-zinc-500",
      };
    default:
      return {
        badge: "border-zinc-200 bg-zinc-100 text-zinc-700",
        dot: "bg-zinc-500",
      };
  }
}

function formatDate(date?: string) {
  if (!date) return "نامشخص";

  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return "نامشخص";
  }
}

function formatPrice(value: number) {
  return `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
}

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function normalizeSearchText(value: string) {
  return normalizeDigits(value).trim().toLowerCase();
}

function getOrderItemsCount(order: Order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("NEWEST");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const load = async () => {
    try {
      setLoading(true);
      setFeedback(null);

      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "خطا در دریافت سفارش‌ها");
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: "دریافت سفارش‌ها با خطا مواجه شد.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (activeFilter !== "ALL") {
      result = result.filter((order) => order.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = normalizeSearchText(searchQuery);

      result = result.filter((order) => {
        const fields = [
          order.id,
          order.id.slice(-8),
          order.user?.name || "",
          order.user?.email || "",
          order.phone || "",
          order.shippingAddress || order.address || "",
          order.postalCode || "",
        ];

        return fields.some((field) =>
          normalizeSearchText(field).includes(query),
        );
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        case "PRICE_DESC":
          return b.totalAmount - a.totalAmount;
        case "PRICE_ASC":
          return a.totalAmount - b.totalAmount;
        case "NEWEST":
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
      }
    });

    return result;
  }, [orders, activeFilter, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    return FILTER_OPTIONS.reduce(
      (acc, status) => {
        acc[status] =
          status === "ALL"
            ? orders.length
            : orders.filter((order) => order.status === status).length;
        return acc;
      },
      {} as Record<FilterType, number>,
    );
  }, [orders]);

  const summary = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    return {
      totalRevenue,
      successful: orders.filter((order) =>
        SUCCESS_STATUSES.includes(order.status as StatusType),
      ).length,
      pending: orders.filter((order) => order.status === "PENDING_PAYMENT")
        .length,
      cancelled: orders.filter((order) =>
        ["CANCELLED", "EXPIRED"].includes(order.status),
      ).length,
    };
  }, [orders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status } : order)),
      );

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("UPDATE_FAILED");
      }

      setFeedback({
        type: "success",
        message: "وضعیت سفارش با موفقیت بروزرسانی شد.",
      });

      await load();
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: "بروزرسانی وضعیت سفارش انجام نشد.",
      });
      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-500">
              <ShieldCheck className="h-4 w-4" />
              مدیریت سفارشات
            </div>

            <div>
              <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">
                پنل سفارش‌ها
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                مشاهده، فیلتر، جستجو و مدیریت وضعیت سفارش‌ها
              </p>
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            بروزرسانی
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="کل سفارش‌ها"
          value={orders.length.toLocaleString("fa-IR")}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="zinc"
        />
        <SummaryCard
          title="درآمد ثبت شده"
          value={formatPrice(summary.totalRevenue)}
          icon={<CircleDollarSign className="h-5 w-5" />}
          tone="emerald"
        />
        <SummaryCard
          title="سفارش‌های موفق"
          value={summary.successful.toLocaleString("fa-IR")}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="sky"
        />
        <SummaryCard
          title="در انتظار پرداخت"
          value={summary.pending.toLocaleString("fa-IR")}
          icon={<Clock3 className="h-5 w-5" />}
          tone="amber"
        />
      </section>

      <section className="space-y-5 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام، ایمیل، شماره تماس، شناسه یا آدرس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pr-11 pl-4 text-sm outline-none transition focus:border-black focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4">
              <ArrowDownWideNarrow className="h-4 w-4 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="bg-transparent text-sm font-bold text-zinc-700 outline-none"
              >
                <option value="NEWEST">جدیدترین‌ها</option>
                <option value="OLDEST">قدیمی‌ترین‌ها</option>
                <option value="PRICE_DESC">بیشترین مبلغ</option>
                <option value="PRICE_ASC">کمترین مبلغ</option>
              </select>
            </div>

            <div className="inline-flex h-12 items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-bold text-zinc-600">
              نتیجه:
              <span className="mr-2 text-zinc-900">
                {filteredOrders.length.toLocaleString("fa-IR")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((status) => {
            const active = activeFilter === status;
            const styles =
              status === "ALL"
                ? null
                : getStatusStyles(status as Exclude<FilterType, "ALL">);

            return (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {status !== "ALL" && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active ? "bg-white" : styles?.dot
                    }`}
                  />
                )}

                <span>{getStatusLabel(status)}</span>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    active ? "bg-white/15 text-white" : "bg-zinc-100"
                  }`}
                >
                  {statusCounts[status].toLocaleString("fa-IR")}
                </span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-2xl border p-4 text-sm font-bold ${
              feedback.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-300" />
          <p className="mt-4 text-sm font-bold text-zinc-500">
            در حال بارگذاری اطلاعات...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-[28px] border border-dashed border-zinc-300 bg-white shadow-sm">
          <SearchX className="h-10 w-10 text-zinc-300" />
          <p className="mt-4 text-sm font-bold text-zinc-500">
            سفارشی یافت نشد.
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            فیلترها یا عبارت جستجو را تغییر بده.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = !!expandedOrders[order.id];
            const isUpdating = updatingId === order.id;
            const customerName = order.user?.name || "بدون نام";
            const customerEmail = order.user?.email || "ایمیل ثبت نشده";
            const itemsCount = getOrderItemsCount(order);
            const statusStyles = getStatusStyles(order.status);
            const shortId = order.id.slice(-8).toUpperCase();
            const orderPhone = order.phone || "";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black ${statusStyles.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`}
                          />
                          {getStatusLabel(order.status)}
                        </span>

                        <div className="relative inline-flex items-center gap-1 rounded-full bg-zinc-100 py-1 pr-3 pl-2 text-[11px] font-bold text-zinc-600">
                          <span>#{shortId}</span>
                          <button
                            onClick={() => handleCopyText(order.id, `${order.id}-id`)}
                            className="mr-1 rounded-md p-1 transition hover:bg-zinc-200 hover:text-zinc-950"
                            title="کپی شناسه کامل سفارش"
                          >
                            {copiedId === `${order.id}-id` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>

                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-500">
                          {itemsCount.toLocaleString("fa-IR")} آیتم
                        </span>

                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold text-zinc-500">
                          {order.paymentType === "FULL"
                            ? "پرداخت کامل"
                            : "بیعانه"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoBox
                          icon={<User2 className="h-4 w-4" />}
                          label="خریدار"
                          value={customerName}
                        />
                        
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
                          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-4 w-4" />
                              شماره تماس
                            </span>
                            {orderPhone && (
                              <div className="flex gap-1.5">
                                <a
                                  href={`tel:${orderPhone}`}
                                  className="rounded-md p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950"
                                  title="تماس مستقیم"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  onClick={() => handleCopyText(orderPhone, `${order.id}-phone`)}
                                  className="rounded-md p-0.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-950"
                                  title="کپی شماره تماس"
                                >
                                  {copiedId === `${order.id}-phone` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                          <div
                            className="truncate text-xs font-black text-zinc-800"
                            dir="ltr"
                            title={orderPhone || "-"}
                          >
                            {orderPhone || "-"}
                          </div>
                        </div>

                        <InfoBox
                          icon={<WalletCards className="h-4 w-4" />}
                          label="مبلغ سفارش"
                          value={formatPrice(order.totalAmount)}
                        />
                        <InfoBox
                          icon={<Clock3 className="h-4 w-4" />}
                          label="تاریخ ثبت"
                          value={formatDate(order.createdAt)}
                        />
                      </div>
                    </div>

                    <div className="w-full shrink-0 xl:w-[240px]">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="mb-3 flex items-center justify-between text-xs font-bold text-zinc-500">
                          <span>تغییر وضعیت</span>
                          {isUpdating && (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          )}
                        </div>

                        <select
                          value={order.status}
                          disabled={isUpdating}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 outline-none transition focus:border-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ${
                    isExpanded
                      ? "grid-rows-[1fr] border-t border-zinc-100"
                      : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden bg-zinc-50/50">
                    <div className="space-y-5 p-5">
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-400">
                            <MapPin className="h-4 w-4" />
                            آدرس ارسال
                          </div>

                          <p className="text-sm leading-7 text-zinc-700">
                            {order.shippingAddress || order.address || "ثبت نشده"}
                          </p>

                          {order.postalCode && (
                            <p
                              className="mt-3 text-xs font-bold text-zinc-500"
                              dir="ltr"
                            >
                              کد پستی: {order.postalCode}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-400">
                            <CreditCard className="h-4 w-4" />
                            اطلاعات سفارش
                          </div>

                          <div className="space-y-3">
                            <DetailRow label="نام" value={customerName} />
                            <DetailRow
                              label="ایمیل"
                              value={customerEmail}
                              valueClassName="truncate"
                            />
                            <DetailRow
                              label="شماره تماس"
                              value={order.phone || "-"}
                              dir="ltr"
                            />
                            <DetailRow
                              label="شناسه کامل سفارش"
                              value={order.id}
                              dir="ltr"
                              valueClassName="truncate"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-black text-zinc-900">
                          <Package className="h-4 w-4" />
                          اقلام سفارش
                        </div>

                        <div className="space-y-3">
                          {order.items.map((item) => {
                            const lineTotal = item.quantity * item.price;

                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                              >
                                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                                  {item.productVariant.color.mainImage ? (
                                    <Image
                                      src={item.productVariant.color.mainImage}
                                      alt={item.productVariant.color.product.name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-zinc-400">
                                      No Img
                                    </div>
                                  )}
                                </div>

                                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="truncate text-sm font-black text-zinc-900">
                                      {item.productVariant.color.product.name}
                                    </h4>
                                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-bold text-zinc-500">
                                      <span>
                                        رنگ: {item.productVariant.color.name}
                                      </span>
                                      <span>سایز: {item.productVariant.size}</span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 text-left">
                                    <div className="text-[10px] font-bold text-zinc-400">
                                      {item.quantity.toLocaleString("fa-IR")} عدد ×{" "}
                                      {item.price.toLocaleString("fa-IR")}
                                    </div>
                                    <div className="text-xs font-black text-zinc-900">
                                      {lineTotal.toLocaleString("fa-IR")} تومان
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedOrders((prev) => ({
                      ...prev,
                      [order.id]: !prev[order.id],
                    }))
                  }
                  className="flex w-full items-center justify-center gap-2 border-t border-zinc-100 py-3 text-[11px] font-bold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      بستن جزئیات
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      مشاهده جزئیات
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {!loading && orders.length > 0 && summary.cancelled > 0 ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {summary.cancelled.toLocaleString("fa-IR")} سفارش در وضعیت لغو شده یا
          منقضی قرار دارند.
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: "zinc" | "emerald" | "sky" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "sky"
        ? "bg-sky-50 text-sky-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : "bg-zinc-100 text-zinc-700";

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-2xl p-3 ${toneClass}`}>{icon}</div>
        <span className="text-xs font-bold text-zinc-400">{title}</span>
      </div>
      <div className="text-xl font-black text-zinc-900">{value}</div>
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
  dir,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
        {icon}
        {label}
      </div>
      <div
        className="truncate text-xs font-black text-zinc-800"
        dir={dir}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  dir,
  valueClassName,
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-xs font-bold text-zinc-400">{label}</span>
      <span
        className={`text-left text-xs font-bold text-zinc-700 ${valueClassName || ""}`}
        dir={dir}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
