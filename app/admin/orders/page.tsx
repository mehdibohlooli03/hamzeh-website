"use client";
import { useEffect, useState } from "react";

const STATUSES = [
  "PENDING_PAYMENT",
  "DEPOSIT_PAID",
  "PAID",
  "SHIPPED",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "CANCELLED",
  "EXPIRED",
];

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  paymentType: string;
  phone: string;
  user: { name: string | null; email: string };
  items: { id: string; quantity: number; price: number; productVariant: { size: string; color: { name: string; product: { name: string } } } }[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = () => fetch("/api/admin/orders").then(r => r.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مدیریت سفارشات</h1>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-right">کاربر</th>
            <th className="p-2 text-right">اقلام</th>
            <th className="p-2 text-right">مبلغ کل</th>
            <th className="p-2 text-right">نوع پرداخت</th>
            <th className="p-2 text-right">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t align-top">
              <td className="p-2">{o.user?.name ?? o.user?.email}</td>
              <td className="p-2">
                {o.items.map(i => (
                  <div key={i.id}>
                    {i.productVariant.color.product.name} – {i.productVariant.color.name} – سایز {i.productVariant.size} × {i.quantity}
                  </div>
                ))}
              </td>
              <td className="p-2">{o.totalAmount.toLocaleString()}</td>
              <td className="p-2">{o.paymentType === "FULL" ? "کامل" : "بیعانه"}</td>
              <td className="p-2">
                <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                  className="border rounded p-1 text-sm">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
