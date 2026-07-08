import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { CartItem, Product } from "@/types/product";
import { BRAZIL_REGION_ID, MEDUSA_CART_ID_KEY, sdk } from "@/lib/medusa";
import placeholderImage from "@/assets/logo-shield.png";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  isLoading: boolean;
  isPending: boolean;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getProduct: (productId: string) => Product | undefined;
}

type MedusaLineItem = {
  id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price?: number;
  title?: string;
  thumbnail?: string | null;
  product?: {
    id?: string;
    title?: string;
    handle?: string;
    thumbnail?: string | null;
  };
  variant?: {
    sku?: string | null;
  };
};

interface MedusaCartState {
  id: string;
  subtotal?: number;
  items?: MedusaLineItem[];
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const MOCK_STORAGE_KEY = "bunker81-cart";
const MEDUSA_CART_FIELDS = "*items,*items.variant,*items.product";
const PRODUCT_VARIANT_FIELDS = "*variants";

const isBrowser = typeof window !== "undefined";

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

function isCartNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { status?: number; response?: { status?: number } };
  const status = err.status ?? err.response?.status;
  if (status === 404) return true;
  if ("message" in error && typeof error.message === "string") {
    return error.message.includes("404") || error.message.toLowerCase().includes("not found");
  }
  return false;
}

function mapCartToItems(cart: MedusaCartState | null): CartItem[] {
  if (!cart?.items?.length) return [];
  return cart.items
    .filter((lineItem) => Boolean(lineItem.product_id))
    .map((lineItem) => ({
      productId: lineItem.product_id!,
      quantity: lineItem.quantity,
    }));
}

function mapLineItemToProduct(lineItem: MedusaLineItem): Product {
  const productId = lineItem.product_id ?? lineItem.product?.id ?? "";
  const name = lineItem.title ?? lineItem.product?.title ?? "Produto";
  const slug = lineItem.product?.handle ?? "";
  const thumbnail = lineItem.thumbnail ?? lineItem.product?.thumbnail ?? null;
  const unitPrice = lineItem.unit_price ?? 0;

  return {
    id: productId,
    name,
    slug,
    category: "",
    subcategory: "",
    brand: "Bunker 81",
    sku: lineItem.variant?.sku ?? "",
    images: thumbnail ? [thumbnail] : [placeholderImage],
    description: "",
    specs: {},
    costPrice: unitPrice,
    price1: unitPrice,
    price2: unitPrice,
    price3: unitPrice,
    currentPrice: unitPrice,
    discountPercent: 0,
    stock: 0,
    isNew: false,
    isPromo: false,
    rating: 0,
    reviewsCount: 0,
  };
}

function getProductFromCart(cart: MedusaCartState | null, productId: string): Product | undefined {
  const lineItem = cart?.items?.find((item) => item.product_id === productId);
  return lineItem ? mapLineItemToProduct(lineItem) : undefined;
}

function getTotalFromCart(cart: MedusaCartState | null): number {
  if (!cart) return 0;
  if (typeof cart.subtotal === "number") return cart.subtotal;
  return (cart.items ?? []).reduce(
    (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
    0,
  );
}

function findLineItemByProductId(
  cart: MedusaCartState | null,
  productId: string,
): MedusaLineItem | undefined {
  return cart?.items?.find((item) => item.product_id === productId);
}

async function fetchOrCreateCart(): Promise<MedusaCartState> {
  const storedId = readStoredMedusaCartId();

  if (storedId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(storedId, {
        fields: MEDUSA_CART_FIELDS,
      });
      return cart as MedusaCartState;
    } catch (error) {
      if (!isCartNotFoundError(error)) throw error;
      clearStoredMedusaCartId();
    }
  }

  const { cart } = await sdk.store.cart.create(
    { region_id: BRAZIL_REGION_ID },
    { fields: MEDUSA_CART_FIELDS },
  );
  saveMedusaCartId(cart.id);
  return cart as MedusaCartState;
}

async function resolveVariantId(productId: string): Promise<string> {
  const { product } = await sdk.store.product.retrieve(productId, {
    fields: PRODUCT_VARIANT_FIELDS,
    region_id: BRAZIL_REGION_ID,
  });

  const variantId = product.variants?.[0]?.id;
  if (!variantId) {
    throw new Error("Produto sem variante disponível.");
  }
  return variantId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [medusaCart, setMedusaCart] = useState<MedusaCartState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const medusaCartRef = useRef<MedusaCartState | null>(null);

  useEffect(() => {
    medusaCartRef.current = medusaCart;
  }, [medusaCart]);

  const refreshCart = useCallback(async (): Promise<MedusaCartState> => {
    clearStoredMedusaCartId();
    const cart = await fetchOrCreateCart();
    setMedusaCart(cart);
    return cart;
  }, []);

  const withCartRecovery = useCallback(
    async <T,>(mutation: (cartId: string) => Promise<T>): Promise<T> => {
      let cartId = medusaCartRef.current?.id ?? readStoredMedusaCartId();
      if (!cartId) {
        const cart = await refreshCart();
        cartId = cart.id;
      }

      try {
        return await mutation(cartId);
      } catch (error) {
        if (!isCartNotFoundError(error)) throw error;
        const cart = await refreshCart();
        return mutation(cart.id);
      }
    },
    [refreshCart],
  );

  useEffect(() => {
    if (!isBrowser) return;

    window.localStorage.removeItem(MOCK_STORAGE_KEY);

    void (async () => {
      try {
        const cart = await fetchOrCreateCart();
        setMedusaCart(cart);
      } catch (error) {
        console.error("[CartContext] Failed to initialize Medusa cart:", error);
        toast.error("Não foi possível carregar o carrinho.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const addItem = useCallback(
    async (productId: string, quantity = 1, variantId?: string) => {
      if (isPending) return;
      setIsPending(true);

      try {
        const resolvedVariantId = variantId ?? (await resolveVariantId(productId));

        await withCartRecovery(async (cartId) => {
          const { cart } = await sdk.store.cart.createLineItem(
            cartId,
            { variant_id: resolvedVariantId, quantity },
            { fields: MEDUSA_CART_FIELDS },
          );
          setMedusaCart(cart as MedusaCartState);
        });
      } catch (error) {
        console.error("[CartContext] Failed to add item:", error);
        toast.error("Não foi possível adicionar ao carrinho.");
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [isPending, withCartRecovery],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (isPending) return;
      const lineItem = findLineItemByProductId(medusaCartRef.current, productId);
      if (!lineItem) return;

      setIsPending(true);
      try {
        await withCartRecovery(async (cartId) => {
          const { parent: cart } = await sdk.store.cart.deleteLineItem(cartId, lineItem.id, {
            fields: MEDUSA_CART_FIELDS,
          });
          setMedusaCart((cart ?? null) as MedusaCartState | null);
        });
      } catch (error) {
        console.error("[CartContext] Failed to remove item:", error);
        toast.error("Não foi possível remover o item.");
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [isPending, withCartRecovery],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (isPending) return;
      const lineItem = findLineItemByProductId(medusaCartRef.current, productId);
      if (!lineItem) return;

      setIsPending(true);
      try {
        await withCartRecovery(async (cartId) => {
          if (quantity <= 0) {
            const { parent: cart } = await sdk.store.cart.deleteLineItem(cartId, lineItem.id, {
              fields: MEDUSA_CART_FIELDS,
            });
            setMedusaCart((cart ?? null) as MedusaCartState | null);
            return;
          }

          const { cart } = await sdk.store.cart.updateLineItem(
            cartId,
            lineItem.id,
            { quantity },
            { fields: MEDUSA_CART_FIELDS },
          );
          setMedusaCart(cart as MedusaCartState);
        });
      } catch (error) {
        console.error("[CartContext] Failed to update quantity:", error);
        toast.error("Não foi possível atualizar a quantidade.");
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [isPending, withCartRecovery],
  );

  const clearCart = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);

    try {
      const cart = await refreshCart();
      setMedusaCart(cart);
    } catch (error) {
      console.error("[CartContext] Failed to clear cart:", error);
      toast.error("Não foi possível esvaziar o carrinho.");
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [isPending, refreshCart]);

  const items = useMemo(() => mapCartToItems(medusaCart), [medusaCart]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => getTotalFromCart(medusaCart), [medusaCart]);

  const getProduct = useCallback(
    (productId: string) => getProductFromCart(medusaCart, productId),
    [medusaCart],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      totalPrice,
      isLoading,
      isPending,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getProduct,
    }),
    [items, itemCount, totalPrice, isLoading, isPending, addItem, removeItem, updateQuantity, clearCart, getProduct],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
