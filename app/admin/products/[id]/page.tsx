"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  restoreColor,
  restoreProduct,
  restoreVariant,
} from "@/lib/admin-restore";
import { parseJsonResponse } from "@/lib/fetcher";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
type Size = (typeof SIZES)[number];

type ProductVariant = {
  id: string;
  size: Size;
  stock: number;
  isActive: boolean;
};

type ProductColor = {
  id: string;
  name: string;
  hexCode: string | null;
  mainImage: string | null;
  isActive: boolean;
  variants: ProductVariant[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: string;
  isActive: boolean;
  colors: ProductColor[];
};

type ColorForm = {
  name: string;
  hexCode: string;
  mainImage: string;
};

type VariantForm = {
  size: Size;
  stock: string;
};

const emptyColorForm: ColorForm = {
  name: "",
  hexCode: "",
  mainImage: "",
};

const emptyVariantForm: VariantForm = {
  size: SIZES[0],
  stock: "",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isActive ? "فعال" : "غیرفعال"}
    </span>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function uploadMainImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/products/upload", {
    method: "POST",
    body: formData,
  });

  const data = await parseJsonResponse<{ url: string }>(response);

  if (!data.url) {
    throw new Error("پاسخ آپلود شامل آدرس تصویر نیست.");
  }

  return data.url;
}

export default function AdminProductDetailsPage({ params }: PageProps) {
  const { id: productId } = use(params);

  const [product, setProduct] = useState<Product | null>(null);

  const [colorForm, setColorForm] = useState<ColorForm>(emptyColorForm);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [editColorForm, setEditColorForm] = useState<ColorForm>(emptyColorForm);

  const [variantForms, setVariantForms] = useState<Record<string, VariantForm>>(
    {}
  );
  const [editVariantForms, setEditVariantForms] = useState<
    Record<string, VariantForm>
  >({});
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submittingColor, setSubmittingColor] = useState(false);
  const [updatingColor, setUpdatingColor] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingVariantFor, setSubmittingVariantFor] = useState<
    string | null
  >(null);
  const [deletingColorId, setDeletingColorId] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(
    null
  );
  const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(
    null
  );
  const [restoringProduct, setRestoringProduct] = useState(false);
  const [restoringColorId, setRestoringColorId] = useState<string | null>(null);
  const [restoringVariantId, setRestoringVariantId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const syncVariantForms = useCallback((data: Product) => {
    setVariantForms((prev) => {
      const next: Record<string, VariantForm> = {};

      for (const color of data.colors) {
        next[color.id] = prev[color.id] ?? { ...emptyVariantForm };
      }

      return next;
    });

    setEditVariantForms((prev) => {
      const next = { ...prev };

      for (const color of data.colors) {
        for (const variant of color.variants) {
          next[variant.id] = prev[variant.id] ?? {
            size: variant.size,
            stock: String(variant.stock),
          };
        }
      }

      return next;
    });
  }, []);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        cache: "no-store",
      });

      const data = await parseJsonResponse<Product>(response);

      setProduct(data);
      syncVariantForms(data);
    } catch (error) {
      const message = getErrorMessage(error, "خطا در دریافت اطلاعات محصول");
      setError(message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, syncVariantForms]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const handleColorFileChange = async (file: File | null) => {
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const url = await uploadMainImage(file);
      setColorForm((prev) => ({ ...prev, mainImage: url }));
      toast.success("تصویر با موفقیت آپلود شد.");
    } catch (error) {
      const message = getErrorMessage(error, "خطا در آپلود تصویر");
      setError(message);
      toast.error(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditColorFileChange = async (file: File | null) => {
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const url = await uploadMainImage(file);
      setEditColorForm((prev) => ({ ...prev, mainImage: url }));
      toast.success("تصویر با موفقیت آپلود شد.");
    } catch (error) {
      const message = getErrorMessage(error, "خطا در آپلود تصویر");
      setError(message);
      toast.error(message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRestoreProduct = async () => {
    setRestoringProduct(true);
    setError(null);

    try {
      const data = await restoreProduct(productId);
      toast.success(data.message || "محصول با موفقیت بازگردانی شد.");
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در بازگردانی محصول");
      setError(message);
      toast.error(message);
    } finally {
      setRestoringProduct(false);
    }
  };

  const submitColor = async () => {
    if (!colorForm.name.trim()) {
      toast.error("نام رنگ الزامی است.");
      return;
    }

    if (
      colorForm.hexCode.trim() &&
      !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(colorForm.hexCode.trim())
    ) {
      toast.error("فرمت hex color نامعتبر است.");
      return;
    }

    setSubmittingColor(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: colorForm.name.trim(),
          hexCode: colorForm.hexCode.trim() || null,
          mainImage: colorForm.mainImage.trim() || null,
        }),
      });

      await parseJsonResponse(response);

      toast.success("رنگ جدید اضافه شد.");
      setColorForm(emptyColorForm);
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در افزودن رنگ");
      setError(message);
      toast.error(message);
    } finally {
      setSubmittingColor(false);
    }
  };

  const startEditingColor = (color: ProductColor) => {
    if (!color.isActive) {
      toast.error("برای ویرایش، ابتدا رنگ را بازگردانی کنید.");
      return;
    }

    setEditingColorId(color.id);
    setEditColorForm({
      name: color.name,
      hexCode: color.hexCode || "",
      mainImage: color.mainImage || "",
    });
  };

  const cancelEditingColor = () => {
    setEditingColorId(null);
    setEditColorForm(emptyColorForm);
  };

  const updateColor = async (colorId: string) => {
    if (!editColorForm.name.trim()) {
      toast.error("نام رنگ الزامی است.");
      return;
    }

    if (
      editColorForm.hexCode.trim() &&
      !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(editColorForm.hexCode.trim())
    ) {
      toast.error("فرمت hex color نامعتبر است.");
      return;
    }

    setUpdatingColor(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/colors/${colorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editColorForm.name.trim(),
          hexCode: editColorForm.hexCode.trim() || null,
          mainImage: editColorForm.mainImage.trim() || null,
        }),
      });

      await parseJsonResponse(response);

      toast.success("تغییرات رنگ با موفقیت ثبت شد.");
      cancelEditingColor();
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در ویرایش رنگ");
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingColor(false);
    }
  };

  const deleteColor = async (colorId: string) => {
    const confirmed = window.confirm(
      "با حذف این رنگ، تمامی سایزها و واریانت‌های مرتبط با آن نیز حذف خواهند شد. مطمئن هستید؟"
    );
    if (!confirmed) return;

    setDeletingColorId(colorId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/colors/${colorId}`, {
        method: "DELETE",
      });

      await parseJsonResponse(response);

      toast.success("رنگ حذف شد.");
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در حذف رنگ");
      setError(message);
      toast.error(message);
    } finally {
      setDeletingColorId(null);
    }
  };

  const handleRestoreColor = async (colorId: string) => {
    setRestoringColorId(colorId);
    setError(null);

    try {
      const data = await restoreColor(colorId);
      toast.success(data.message || "رنگ با موفقیت بازگردانی شد.");
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در بازگردانی رنگ");
      setError(message);
      toast.error(message);
    } finally {
      setRestoringColorId(null);
    }
  };

  const updateVariantForm = (
    colorId: string,
    field: keyof VariantForm,
    value: string
  ) => {
    setVariantForms((prev) => ({
      ...prev,
      [colorId]: {
        ...(prev[colorId] || emptyVariantForm),
        [field]: value as VariantForm[keyof VariantForm],
      },
    }));
  };

  const updateEditVariantForm = (
    variantId: string,
    field: keyof VariantForm,
    value: string
  ) => {
    setEditVariantForms((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] || emptyVariantForm),
        [field]: value as VariantForm[keyof VariantForm],
      },
    }));
  };

  const submitVariant = async (colorId: string) => {
    const form = variantForms[colorId] || emptyVariantForm;
    const stock = Number(form.stock);

    if (!form.size) {
      toast.error("سایز را انتخاب کن.");
      return;
    }

    if (form.stock === "" || Number.isNaN(stock) || stock < 0) {
      toast.error("موجودی باید عددی معتبر و صفر یا بیشتر باشد.");
      return;
    }

    setSubmittingVariantFor(colorId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/colors/${colorId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: form.size,
          stock,
        }),
      });

      await parseJsonResponse(response);

      toast.success("واریانت با موفقیت اضافه شد.");
      setVariantForms((prev) => ({
        ...prev,
        [colorId]: { ...emptyVariantForm },
      }));
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در افزودن واریانت");
      setError(message);
      toast.error(message);
    } finally {
      setSubmittingVariantFor(null);
    }
  };

  const deleteVariant = async (variantId: string) => {
    const confirmed = window.confirm("از حذف این واریانت مطمئن هستی؟");
    if (!confirmed) return;

    setDeletingVariantId(variantId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: "DELETE",
      });

      await parseJsonResponse(response);

      toast.success("واریانت حذف شد.");
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در حذف واریانت");
      setError(message);
      toast.error(message);
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleRestoreVariant = async (variantId: string) => {
    setRestoringVariantId(variantId);
    setError(null);

    try {
      const data = await restoreVariant(variantId);
      toast.success(data.message || "واریانت با موفقیت بازگردانی شد.");
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در بازگردانی واریانت");
      setError(message);
      toast.error(message);
    } finally {
      setRestoringVariantId(null);
    }
  };

  const updateVariant = async (variantId: string) => {
    const form = editVariantForms[variantId];

    if (!form) {
      toast.error("فرم واریانت آماده نیست.");
      return;
    }

    const stock = Number(form.stock);

    if (!form.size) {
      toast.error("سایز الزامی است.");
      return;
    }

    if (form.stock === "" || Number.isNaN(stock) || stock < 0) {
      toast.error("موجودی باید عددی معتبر و صفر یا بیشتر باشد.");
      return;
    }

    setUpdatingVariantId(variantId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: form.size,
          stock,
        }),
      });

      await parseJsonResponse(response);

      toast.success("واریانت ویرایش شد.");
      setEditingVariantId(null);
      await loadProduct();
    } catch (error) {
      const message = getErrorMessage(error, "خطا در ویرایش واریانت");
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingVariantId(null);
    }
  };

  const isAnyBusy = useMemo(
    () =>
      loading ||
      submittingColor ||
      updatingColor ||
      uploadingImage ||
      deletingColorId !== null ||
      deletingVariantId !== null ||
      updatingVariantId !== null ||
      restoringProduct ||
      restoringColorId !== null ||
      restoringVariantId !== null ||
      submittingVariantFor !== null,
    [
      loading,
      submittingColor,
      updatingColor,
      uploadingImage,
      deletingColorId,
      deletingVariantId,
      updatingVariantId,
      restoringProduct,
      restoringColorId,
      restoringVariantId,
      submittingVariantFor,
    ]
  );

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground" dir="rtl">
        در حال بارگذاری...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4 p-6" dir="rtl">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error || "محصول پیدا نشد."}
        </div>
        <Button asChild variant="outline" type="button">
          <Link href="/admin/products">بازگشت به لیست محصولات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">جزئیات محصول: {product.name}</h1>
            <StatusBadge isActive={product.isActive} />
          </div>

          <p className="text-sm text-muted-foreground">
            اسلاگ: {product.slug} | قیمت: {product.price.toLocaleString("fa-IR")}{" "}
            تومان
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {!product.isActive ? (
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleRestoreProduct}
              disabled={restoringProduct || isAnyBusy}
            >
              {restoringProduct ? "در حال بازگردانی..." : "بازگردانی محصول"}
            </Button>
          ) : null}

          <Button asChild variant="outline" type="button">
            <Link href="/admin/products">بازگشت به لیست محصولات</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="text-lg font-semibold">افزودن رنگ جدید</h2>
          <p className="text-sm text-muted-foreground">
            برای هر محصول می‌توانی چند رنگ با تصویر اصلی جداگانه ثبت کنی.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="نام رنگ (مثال: مشکی)"
            value={colorForm.name}
            onChange={(e) =>
              setColorForm((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={submittingColor || !product.isActive || isAnyBusy}
          />

          <Input
            placeholder="کد هگز (مثال: #000000)"
            value={colorForm.hexCode}
            onChange={(e) =>
              setColorForm((prev) => ({ ...prev, hexCode: e.target.value }))
            }
            disabled={submittingColor || !product.isActive || isAnyBusy}
          />

          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(e) =>
                void handleColorFileChange(e.target.files?.[0] ?? null)
              }
              disabled={
                submittingColor || uploadingImage || !product.isActive || isAnyBusy
              }
            />
            {uploadingImage ? (
              <p className="text-xs text-muted-foreground">در حال آپلود تصویر...</p>
            ) : colorForm.mainImage ? (
              <p className="truncate text-xs text-muted-foreground">
                تصویر: {colorForm.mainImage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={submitColor}
            disabled={submittingColor || !product.isActive || isAnyBusy}
          >
            {submittingColor ? "در حال ثبت..." : "افزودن رنگ"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setColorForm(emptyColorForm)}
            disabled={submittingColor || !product.isActive || isAnyBusy}
          >
            پاک کردن فرم
          </Button>
        </div>

        {!product.isActive ? (
          <p className="text-xs text-muted-foreground">
            برای افزودن رنگ جدید، ابتدا خود محصول را بازگردانی کن.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">رنگ‌ها و واریانت‌ها</h2>
          <p className="text-sm text-muted-foreground">
            برای هر رنگ، سایزها و موجودی انبار را تعریف کن.
          </p>
        </div>

        {product.colors.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            هنوز رنگی برای این محصول ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-4">
            {product.colors.map((color) => {
              const variantForm = variantForms[color.id] || emptyVariantForm;
              const isSubmittingVariant = submittingVariantFor === color.id;
              const isDeletingColor = deletingColorId === color.id;
              const isEditingColor = editingColorId === color.id;
              const isRestoringColor = restoringColorId === color.id;
              const isColorBusy =
                isDeletingColor ||
                isRestoringColor ||
                updatingColor ||
                submittingColor ||
                isAnyBusy;

              return (
                <div
                  key={color.id}
                  className="rounded-lg border bg-card p-4 text-card-foreground"
                >
                  {isEditingColor ? (
                    <div className="mb-4 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <h4 className="text-sm font-semibold text-primary">
                        ویرایش مشخصات رنگ
                      </h4>

                      <div className="grid gap-3 md:grid-cols-3">
                        <Input
                          placeholder="نام رنگ"
                          value={editColorForm.name}
                          onChange={(e) =>
                            setEditColorForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          disabled={updatingColor || isAnyBusy}
                        />

                        <Input
                          placeholder="کد رنگ (مثال: #ffffff)"
                          value={editColorForm.hexCode}
                          onChange={(e) =>
                            setEditColorForm((prev) => ({
                              ...prev,
                              hexCode: e.target.value,
                            }))
                          }
                          disabled={updatingColor || isAnyBusy}
                        />

                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            onChange={(e) =>
                              void handleEditColorFileChange(
                                e.target.files?.[0] ?? null
                              )
                            }
                            disabled={updatingColor || uploadingImage || isAnyBusy}
                          />
                          {uploadingImage ? (
                            <p className="text-xs text-muted-foreground">
                              در حال آپلود تصویر...
                            </p>
                          ) : editColorForm.mainImage ? (
                            <p className="truncate text-xs text-muted-foreground">
                              تصویر: {editColorForm.mainImage}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => updateColor(color.id)}
                          disabled={updatingColor || isAnyBusy}
                        >
                          {updatingColor
                            ? "در حال ثبت تغییرات..."
                            : "ذخیره تغییرات"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditingColor}
                          disabled={updatingColor || isAnyBusy}
                        >
                          انصراف
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2 text-right">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{color.name}</h3>
                          <StatusBadge isActive={color.isActive} />
                        </div>

                        <p className="text-sm text-muted-foreground">
                          کد رنگ: {color.hexCode || "-"} | تصویر اصلی:{" "}
                          <span className="inline-block max-w-xs truncate align-bottom">
                            {color.mainImage || "-"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {color.hexCode ? (
                          <div
                            className="h-8 w-8 rounded-md border shadow-sm"
                            style={{ backgroundColor: color.hexCode }}
                            title={color.hexCode}
                          />
                        ) : null}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => startEditingColor(color)}
                          disabled={isColorBusy || !color.isActive}
                        >
                          ویرایش رنگ
                        </Button>

                        {color.isActive ? (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteColor(color.id)}
                            disabled={isColorBusy}
                          >
                            {isDeletingColor ? "در حال حذف..." : "حذف رنگ"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => handleRestoreColor(color.id)}
                            disabled={isColorBusy}
                          >
                            {isRestoringColor
                              ? "در حال بازگردانی..."
                              : "بازگردانی رنگ"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg border border-dashed p-3">
                    <h4 className="mb-3 text-sm font-medium text-right">
                      افزودن سایز و موجودی
                    </h4>

                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        value={variantForm.size}
                        onChange={(e) =>
                          updateVariantForm(color.id, "size", e.target.value)
                        }
                        disabled={
                          isSubmittingVariant ||
                          !product.isActive ||
                          !color.isActive ||
                          isAnyBusy
                        }
                        className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>

                      <Input
                        placeholder="موجودی"
                        type="number"
                        min={0}
                        value={variantForm.stock}
                        onChange={(e) =>
                          updateVariantForm(color.id, "stock", e.target.value)
                        }
                        disabled={
                          isSubmittingVariant ||
                          !product.isActive ||
                          !color.isActive ||
                          isAnyBusy
                        }
                      />

                      <Button
                        type="button"
                        onClick={() => submitVariant(color.id)}
                        disabled={
                          isSubmittingVariant ||
                          !product.isActive ||
                          !color.isActive ||
                          isAnyBusy
                        }
                      >
                        {isSubmittingVariant
                          ? "در حال ثبت..."
                          : "افزودن واریانت"}
                      </Button>
                    </div>

                    {!product.isActive ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        برای افزودن واریانت جدید، ابتدا خود محصول را بازگردانی کن.
                      </p>
                    ) : !color.isActive ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        برای افزودن واریانت جدید، ابتدا این رنگ را بازگردانی کن.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 text-right">
                    <h4 className="mb-2 text-sm font-medium">
                      سایزها و موجودی ثبت شده
                    </h4>

                    {color.variants.length === 0 ? (
                      <div className="text-right text-sm text-muted-foreground">
                        هنوز واریانتی برای این رنگ ثبت نشده است.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {color.variants.map((variant) => {
                          const isEditing = editingVariantId === variant.id;
                          const editForm =
                            editVariantForms[variant.id] || emptyVariantForm;
                          const isDeletingVariant =
                            deletingVariantId === variant.id;
                          const isUpdatingVariant =
                            updatingVariantId === variant.id;
                          const isRestoringVariant =
                            restoringVariantId === variant.id;
                          const isVariantBusy =
                            isDeletingVariant ||
                            isUpdatingVariant ||
                            isRestoringVariant ||
                            isAnyBusy;

                          return (
                            <div
                              key={variant.id}
                              className="rounded-lg border bg-muted/40 p-3"
                            >
                              {isEditing ? (
                                <div className="grid gap-3 md:grid-cols-4">
                                  <select
                                    value={editForm.size}
                                    onChange={(e) =>
                                      updateEditVariantForm(
                                        variant.id,
                                        "size",
                                        e.target.value
                                      )
                                    }
                                    disabled={isUpdatingVariant || isAnyBusy}
                                    className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                  >
                                    {SIZES.map((size) => (
                                      <option key={size} value={size}>
                                        {size}
                                      </option>
                                    ))}
                                  </select>

                                  <Input
                                    type="number"
                                    min={0}
                                    value={editForm.stock}
                                    onChange={(e) =>
                                      updateEditVariantForm(
                                        variant.id,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    placeholder="موجودی"
                                    disabled={isUpdatingVariant || isAnyBusy}
                                  />

                                  <Button
                                    type="button"
                                    onClick={() => updateVariant(variant.id)}
                                    disabled={isUpdatingVariant || isAnyBusy}
                                  >
                                    {isUpdatingVariant
                                      ? "در حال ذخیره..."
                                      : "ذخیره"}
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingVariantId(null)}
                                    disabled={isUpdatingVariant || isAnyBusy}
                                  >
                                    انصراف
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div className="space-y-2 text-sm font-medium">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span>
                                        سایز:{" "}
                                        <span className="text-primary">
                                          {variant.size}
                                        </span>{" "}
                                        | موجودی:{" "}
                                        <span className="text-primary">
                                          {variant.stock}
                                        </span>
                                      </span>

                                      <StatusBadge
                                        isActive={variant.isActive}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        if (!variant.isActive) {
                                          toast.error(
                                            "برای ویرایش، ابتدا واریانت را بازگردانی کنید."
                                          );
                                          return;
                                        }

                                        setEditingVariantId(variant.id);
                                        setEditVariantForms((prev) => ({
                                          ...prev,
                                          [variant.id]: {
                                            size: variant.size,
                                            stock: String(variant.stock),
                                          },
                                        }));
                                      }}
                                      disabled={isVariantBusy || !variant.isActive}
                                    >
                                      ویرایش
                                    </Button>

                                    {variant.isActive ? (
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => deleteVariant(variant.id)}
                                        disabled={isVariantBusy}
                                      >
                                        {isDeletingVariant
                                          ? "در حال حذف..."
                                          : "حذف"}
                                      </Button>
                                    ) : (
                                      <Button
                                        type="button"
                                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                                        onClick={() =>
                                          handleRestoreVariant(variant.id)
                                        }
                                        disabled={isVariantBusy}
                                      >
                                        {isRestoringVariant
                                          ? "در حال بازگردانی..."
                                          : "بازگردانی"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
