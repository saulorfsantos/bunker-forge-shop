import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "@/types/product";
import { getProductById } from "@/data/mockData";
import { BRAZIL_REGION_ID, MEDUSA_CART_ID_KEY, sdk } from "@/lib/medusa";

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

/** Medusa cart payload kept internally until wired to the public API. */
interface MedusaCartState {
  id: string;
  items?: unknown[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "bunker81-cart";
const MEDUSA_CART_FIELDS = "*items,*items.variant,*items.product";

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

function readStoredMedusaCartId(): string | null {
  if (!isBrowser) return null;
  return window.localStorage.getItem(MEDUSA_CART_ID_KEY);
}

function saveMedusaCartId(cartId: string): void {
  if (!isBrowser) return;
  window.localStorage.setItem(MEDUSA_CART_ID_KEY, cartId);
}

function clearStoredMedusaCartId(): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(MEDUSA_CART_ID_KEY);
}

async function getOrCreateCart(): Promise<MedusaCartState | null> {
  if (!isBrowser) return null;

  try {
    const storedId = readStoredMedusaCartId();

    if (storedId) {
      try {
        const { cart } = await sdk.store.cart.retrieve(storedId, {
          fields: MEDUSA_CART_FIELDS,
        });
        return cart as MedusaCartState;
      } catch {
        clearStoredMedusaCartId();
      }
    }

    const { cart } = await sdk.store.cart.create(
      { region_id: BRAZIL_REGION_ID },
      { fields: MEDUSA_CART_FIELDS },
    );
    saveMedusaCartId(cart.id);
    return cart as MedusaCartState;
  } catch (error) {
    console.error("[CartContext] Failed to get or create Medusa cart:", error);
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [medusaCart, setMedusaCart] = useState<MedusaCartState | null>(null);

  useEffect(() => {
    setItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isBrowser) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (!isBrowser) return;

    void getOrCreateCart().then((cart) => {
      if (!cart) return;
      setMedusaCart(cart);
      console.log("[CartContext] Medusa cart ready:", {
        cart_id: cart.id,
        items: cart.items ?? [],
      });
    });
  }, []);

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
