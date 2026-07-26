"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { restoreProduct } from "@/lib/admin-restore";

const CATEGORIES = ["TSHIRT", "PANTS", "SHIRT", "JACKET"] as const;

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: (typeof CATEGORIES)[number];
  isActive: boolean;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  category: (typeof CATEGORIES)[number];
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category: CATEGORIES[0],
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/admin/products", {
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "خطا در دریافت محصولات");
      }

      setProducts(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "لیست محصولات بارگذاری نشد."));
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.price.trim()) {
      toast.error("نام، اسلاگ و قیمت الزامی هستند.");
      return;
    }

    const parsedPrice = Number(form.price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error("قیمت واردشده معتبر نیست.");
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        price: parsedPrice,
        category: form.category,
      };

      const url = editId
        ? `/api/admin/products/${editId}`
        : "/api/admin/products";
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "ذخیره محصول انجام نشد");
      }

      toast.success(editId ? "محصول ویرایش شد." : "محصول جدید اضافه شد.");
      setEditId(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "خطا در ذخیره محصول."));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    const ok = confirm("از حذف این محصول مطمئن هستید؟");
    if (!ok) return;

    try {
      setDeletingId(id);

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "حذف محصول انجام نشد");
      }

      toast.success("محصول حذف (یا غیرفعال) شد.");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "خطا در حذف محصول."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      setRestoringId(id);

      const result = await restoreProduct(id);

      toast.success(result.message || "محصول با موفقیت بازگردانی شد.");
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "خطا در بازگردانی محصول."));
    } finally {
      setRestoringId(null);
    }
  };

  const startEdit = (product: Product) => {
    if (!product.isActive) {
      toast.error("برای ویرایش، ابتدا محصول را بازگردانی کنید.");
      return;
    }

    setEditId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      category: product.category,
    });
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت محصولات</h1>
      </div>

      <div className="grid max-w-4xl gap-3 rounded-lg border bg-white p-4 md:grid-cols-3">
        <Input
          placeholder="نام"
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          disabled={submitting}
        />

        <Input
          placeholder="اسلاگ"
          value={form.slug}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, slug: e.target.value }))
          }
          disabled={submitting}
        />

        <Input
          placeholder="قیمت (تومان)"
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, price: e.target.value }))
          }
          disabled={submitting}
        />

        <select
          value={form.category}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              category: e.target.value as FormState["category"],
            }))
          }
          className="rounded-md border bg-background px-3 py-2 text-sm"
          disabled={submitting}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <Input
          placeholder="توضیحات"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className="md:col-span-2"
          disabled={submitting}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting
            ? "در حال ذخیره..."
            : editId
              ? "ذخیره ویرایش"
              : "افزودن محصول"}
        </Button>

        {editId ? (
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={submitting}
          >
            لغو
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-right">نام</th>
              <th className="p-3 text-right">دسته</th>
              <th className="p-3 text-right">قیمت</th>
              <th className="p-3 text-right">وضعیت</th>
              <th className="p-3 text-right">عملیات</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  className="p-4 text-center text-muted-foreground"
                  colSpan={5}
                >
                  در حال بارگذاری محصولات...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  className="p-4 text-center text-muted-foreground"
                  colSpan={5}
                >
                  محصولی ثبت نشده است.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isDeleting = deletingId === product.id;
                const isRestoring = restoringId === product.id;
                const isBusy =
                  submitting || deletingId !== null || restoringId !== null;

                return (
                  <tr
                    key={product.id}
                    className={`border-t ${
                      product.isActive
                        ? ""
                        : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">{product.category}</td>
                    <td className="p-3">
                      {product.price.toLocaleString("fa-IR")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="secondary"
                          type="button"
                        >
                          <Link href={`/admin/products/${product.id}`}>
                            جزئیات
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(product)}
                          disabled={isBusy || !product.isActive}
                        >
                          ویرایش
                        </Button>

                        {product.isActive ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => remove(product.id)}
                            disabled={isBusy}
                          >
                            {isDeleting ? "در حال حذف..." : "حذف"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => handleRestore(product.id)}
                            disabled={isBusy}
                          >
                            {isRestoring ? "در حال بازگردانی..." : "بازگردانی"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        رنگ‌ها، سایزها و موجودی هر محصول را می‌توانی در صفحه جزئیات مدیریت کنی.
      </p>
    </div>
  );
}
