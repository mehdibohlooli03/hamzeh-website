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
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

const clampQuantity = (quantity: number, stock: number) =>
  Math.max(1, Math.min(quantity, stock));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

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
              {
                ...item,
                quantity: clampQuantity(quantity, item.stock),
              },
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

      setItems: (items) => set({ items }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "real-hamzeh-cart",
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== "object") {
          return { items: [] };
        }

        const state = persistedState as Partial<CartState> & {
          items?: Partial<CartItem>[];
        };

        if (version < 2) {
          return {
            ...state,
            items: (state.items ?? []).map((item) => {
              const quantity = Math.max(1, Number(item.quantity ?? 1));

              return {
                id: item.id ?? item.variantId ?? "",
                productId: item.productId ?? "",
                variantId: item.variantId ?? "",
                name: item.name ?? "",
                slug: item.slug ?? "",
                price: Number(item.price ?? 0),
                quantity,
                stock: Math.max(1, Number(item.stock ?? quantity)),
                size: item.size ?? "",
                colorName: item.colorName ?? "",
                colorValue: item.colorValue,
                image: item.image,
              };
            }),
          };
        }

        return state as CartState;
      },
    },
  ),
);
