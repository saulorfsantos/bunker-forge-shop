export interface MercadoPagoCheckoutLifecycle {
  beginCart: (cartId: string) => boolean;
  reset: () => void;
}

export function createMercadoPagoCheckoutLifecycle(): MercadoPagoCheckoutLifecycle {
  let initializedCartId: string | null = null;

  return {
    beginCart(cartId) {
      if (initializedCartId === cartId) return false;
      initializedCartId = cartId;
      return true;
    },
    reset() {
      initializedCartId = null;
    },
  };
}
