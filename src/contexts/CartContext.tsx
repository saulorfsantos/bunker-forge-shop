import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "@/types/product";
import { getProductById } from "@/data/mockData";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getProduct: (productId: string) => Product | undefined;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "bunker81-cart";

const isBrowser = typeof window !== "undefined";

function readStoredItems(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => {
      const p = getProductById(i.productId);
      return p ? sum + p.currentPrice * i.quantity : sum;
    }, 0);

    return {
      items,
      itemCount,
      totalPrice,
      getProduct: getProductById,
      addItem: (productId, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === productId);
          if (existing) {
            return prev.map((i) =>
              i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i,
            );
          }
          return [...prev, { productId, quantity }];
        });
      },
      removeItem: (productId) =>
        setItems((prev) => prev.filter((i) => i.productId !== productId)),
      updateQuantity: (productId, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        ),
      clearCart: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
