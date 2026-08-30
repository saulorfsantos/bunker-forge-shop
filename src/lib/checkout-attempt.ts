export interface PaymentSessionState {
  provider_id: string;
}

export interface CartPaymentState {
  id: string;
  payment_collection?: {
    id: string;
    payment_sessions?: PaymentSessionState[];
  } | null;
}

export interface CheckoutAttemptOperations<Cart extends CartPaymentState, Order> {
  retrieveCart: (cartId: string) => Promise<Cart>;
  initiatePaymentSession: (cart: Cart, providerId: string) => Promise<void>;
  completeCart: (cartId: string) => Promise<Order>;
}

export async function completeCheckoutAttempt<Cart extends CartPaymentState, Order>(
  cartId: string,
  providerId: string,
  operations: CheckoutAttemptOperations<Cart, Order>,
): Promise<Order> {
  const currentCart = await operations.retrieveCart(cartId);
  const hasSelectedProviderSession = currentCart.payment_collection?.payment_sessions?.some(
    (session) => session.provider_id === providerId,
  );

  if (!hasSelectedProviderSession) {
    await operations.initiatePaymentSession(currentCart, providerId);
  }

  return operations.completeCart(currentCart.id);
}

export interface SubmissionLock {
  tryAcquire: () => boolean;
  release: () => void;
}

export function createSubmissionLock(): SubmissionLock {
  let isLocked = false;

  return {
    tryAcquire: () => {
      if (isLocked) return false;
      isLocked = true;
      return true;
    },
    release: () => {
      isLocked = false;
    },
  };
}
