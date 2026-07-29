import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  stock: number;
  size: string;
  colorName: string;
  colorValue?: string;
  image?: string;
};

type CartState = {
  items: CartItem[];
  lastClearedOrderId: string | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  clearCartForOrder: (orderId: string) => void;
  hasClearedCartForOrder: (orderId: string) => boolean;
  setItems: (items: CartItem[]) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

const clampQuantity = (quantity: number, stock: number) =>
  Math.max(1, Math.min(quantity, stock));

const normalizeCartItem = (item: Partial<CartItem>): CartItem => {
  const quantity = Math.max(1, Number(item.quantity ?? 1));
  const stock = Math.max(1, Number(item.stock ?? quantity));

  return {
    id: item.id ?? item.variantId ?? "",
    productId: item.productId ?? "",
    variantId: item.variantId ?? "",
    name: item.name ?? "",
    slug: item.slug ?? "",
    price: Number(item.price ?? 0),
    quantity: clampQuantity(quantity, stock),
    stock,
    size: item.size ?? "",
    colorName: item.colorName ?? "",
    colorValue: item.colorValue,
    image: item.image,
  };
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastClearedOrderId: null,

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => cartItem.variantId === item.variantId,
          );

          if (existingItem) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? {
                      ...cartItem,
                      quantity: clampQuantity(
                        cartItem.quantity + quantity,
                        cartItem.stock,
                      ),
                    }
                  : cartItem,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              normalizeCartItem({
                ...item,
                quantity,
              }),
            ],
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: clampQuantity(quantity, item.stock),
                }
              : item,
          ),
        })),

      clearCart: () => set({ items: [] }),

      clearCartForOrder: (orderId) => {
        const normalizedOrderId = orderId.trim();

        if (!normalizedOrderId) return;

        set((state) => {
          if (state.lastClearedOrderId === normalizedOrderId) {
            return state;
          }

          return {
            items: [],
            lastClearedOrderId: normalizedOrderId,
          };
        });
      },

      hasClearedCartForOrder: (orderId) => {
        const normalizedOrderId = orderId.trim();

        if (!normalizedOrderId) return false;

        return get().lastClearedOrderId === normalizedOrderId;
      },

      setItems: (items) =>
        set({
          items: items.map((item) => normalizeCartItem(item)),
        }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "real-hamzeh-cart",
      version: 3,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== "object") {
          return {
            items: [],
            lastClearedOrderId: null,
          };
        }

        const state = persistedState as Partial<CartState> & {
          items?: Partial<CartItem>[];
          lastClearedOrderId?: unknown;
        };

        const normalizedItems = (state.items ?? []).map((item) =>
          normalizeCartItem(item),
        );

        if (version < 3) {
          return {
            ...state,
            items: normalizedItems,
            lastClearedOrderId: null,
          };
        }

        return {
          ...state,
          items: normalizedItems,
          lastClearedOrderId:
            typeof state.lastClearedOrderId === "string"
              ? state.lastClearedOrderId
              : null,
        } as CartState;
      },
    },
  ),
);
