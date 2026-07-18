"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["TSHIRT", "PANTS", "SHIRT", "JACKET"];

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: string;
  isActive: boolean;
};

const emptyForm = { name: "", slug: "", description: "", price: "", category: CATEGORIES[0], isActive: true };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => fetch("/api/admin/products").then(r => r.json()).then(setProducts);
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const body = { ...form, price: Number(form.price) };
    if (editId) {
      await fetch(`/api/admin/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setEditId(null);
    } else {
      await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setForm(emptyForm);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: String(p.price),
      category: p.category,
      isActive: p.isActive,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدیریت محصولات</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-3xl">
        <Input placeholder="نام" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input placeholder="اسلاگ (slug)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
        <Input placeholder="قیمت (تومان)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="border rounded p-2 text-sm">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Input placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="col-span-2" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
          فعال
        </label>
      </div>

      <div className="flex gap-2">
        <Button onClick={submit}>{editId ? "ذخیره ویرایش" : "افزودن محصول"}</Button>
        {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm(emptyForm); }}>لغو</Button>}
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-right">نام</th>
            <th className="p-2 text-right">دسته</th>
            <th className="p-2 text-right">قیمت</th>
            <th className="p-2 text-right">فعال</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2">{p.price.toLocaleString()}</td>
              <td className="p-2">{p.isActive ? "بله" : "خیر"}</td>
              <td className="p-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>ویرایش</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>حذف</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-gray-500">
        رنگ‌ها، سایزها و موجودی هر محصول (ProductColor / ProductVariant) نیاز به صفحه جزئیات جداگانه دارن — چون در همین فرم نمی‌گنجن.
      </p>
    </div>
  );
}
