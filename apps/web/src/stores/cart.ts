import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  supermarketId: string;
  supermarketName: string;
  price: number;
  quantity: number;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  sessionId: string;

  // Actions
  addItem: (item: Omit<CartItem, "id" | "addedAt">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotalByStore: (storeId: string) => number;
  getGrandTotal: () => number;
  getItemsByStore: () => Record<string, CartItem[]>;
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),

      addItem: (item) =>
        set((state) => {
          const itemId = `${item.productId}-${item.supermarketId}`;
          const existing = state.items.find((i) => i.id === itemId);

          if (existing) {
            // Same product + same store → increment quantity
            return {
              items: state.items.map((i) =>
                i.id === itemId
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }

          // New item
          return {
            items: [
              ...state.items,
              {
                ...item,
                id: itemId,
                quantity: item.quantity || 1,
                addedAt: new Date().toISOString(),
              },
            ],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.id !== id)
              : state.items.map((item) =>
                  item.id === id ? { ...item, quantity } : item
                ),
        })),

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotalByStore: (storeId) =>
        get()
          .items.filter((item) => item.supermarketId === storeId)
          .reduce((total, item) => total + item.price * item.quantity, 0),

      getGrandTotal: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),

      getItemsByStore: () => {
        const grouped: Record<string, CartItem[]> = {};
        for (const item of get().items) {
          if (!grouped[item.supermarketId]) {
            grouped[item.supermarketId] = [];
          }
          grouped[item.supermarketId].push(item);
        }
        return grouped;
      },
    }),
    {
      name: "ofertasas-cart",
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
      }),
    }
  )
);
