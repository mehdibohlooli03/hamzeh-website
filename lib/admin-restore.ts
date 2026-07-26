import { parseJsonResponse } from "@/lib/fetcher";

type RestoreEntityBase = {
  id: string;
  isActive: boolean;
};

export type RestoredProduct = RestoreEntityBase;

export type RestoredColor = RestoreEntityBase & {
  productId: string;
};

export type RestoredVariant = RestoreEntityBase & {
  colorId: string;
};

export type RestoreResponse<T> = {
  message: string;
} & T;

export async function restoreProduct(
  productId: string,
): Promise<RestoreResponse<{ product: RestoredProduct }>> {
  const response = await fetch(`/api/admin/products/${productId}/restore`, {
    method: "PATCH",
  });

  return parseJsonResponse<RestoreResponse<{ product: RestoredProduct }>>(
    response,
  );
}

export async function restoreColor(
  colorId: string,
): Promise<RestoreResponse<{ color: RestoredColor }>> {
  const response = await fetch(`/api/admin/colors/${colorId}/restore`, {
    method: "PATCH",
  });

  return parseJsonResponse<RestoreResponse<{ color: RestoredColor }>>(
    response,
  );
}

export async function restoreVariant(
  variantId: string,
): Promise<RestoreResponse<{ variant: RestoredVariant }>> {
  const response = await fetch(`/api/admin/variants/${variantId}/restore`, {
    method: "PATCH",
  });

  return parseJsonResponse<RestoreResponse<{ variant: RestoredVariant }>>(
    response,
  );
}
