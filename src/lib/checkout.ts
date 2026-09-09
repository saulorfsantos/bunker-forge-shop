import { BRAZIL_REGION_ID, MEDUSA_CART_ID_KEY, sdk } from "@/lib/medusa";
import {
  areCheckoutLineItemPricesAvailable,
  completeCheckoutAttempt,
  type CartPaymentState,
} from "@/lib/checkout-attempt";

export const CHECKOUT_CONFIRMATION_KEY = "bunker81-last-order";

export interface CheckoutAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: "br";
  phone: string;
}

export interface CheckoutLineItem {
  id: string;
  title?: string;
  quantity: number;
  unit_price?: number;
}

export interface CheckoutCart {
  id: string;
  email?: string;
  region_id?: string;
  currency_code?: string;
  subtotal?: number;
  shipping_total?: number;
  tax_total?: number;
  total?: number;
  items?: CheckoutLineItem[];
  payment_collection?: CartPaymentState["payment_collection"];
}

export interface ShippingOption {
  id: string;
  name: string;
  amount?: number;
  price_type?: string;
}

export interface PaymentProvider {
  id: string;
}

export interface OrderReceipt {
  id: string;
  display_id?: number;
  email?: string;
  currency_code?: string;
  total?: number;
  created_at?: string;
  status?: string;
  items?: CheckoutLineItem[];
}

const CART_FIELDS =
  "id,email,region_id,currency_code,subtotal,shipping_total,tax_total,total,*items,*payment_collection,*payment_collection.payment_sessions";
const ORDER_FIELDS = "id,display_id,email,currency_code,total,created_at,status,*items";

export function getActiveCartId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MEDUSA_CART_ID_KEY);
}

export async function retrieveCheckoutCart(cartId: string): Promise<CheckoutCart> {
  const { cart } = await sdk.store.cart.retrieve(cartId, { fields: CART_FIELDS });
  return cart as CheckoutCart;
}

export async function saveCheckoutAddress(
  cartId: string,
  email: string,
  address: CheckoutAddress,
): Promise<CheckoutCart> {
  const { cart } = await sdk.store.cart.update(
    cartId,
    {
      email,
      shipping_address: address,
      billing_address: address,
    },
    { fields: CART_FIELDS },
  );
  return cart as CheckoutCart;
}

export async function listShippingOptions(cartId: string): Promise<ShippingOption[]> {
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId });
  return shipping_options as ShippingOption[];
}

export async function selectShippingOption(
  cartId: string,
  optionId: string,
): Promise<CheckoutCart> {
  const { cart } = await sdk.store.cart.addShippingMethod(
    cartId,
    { option_id: optionId },
    { fields: CART_FIELDS },
  );
  return cart as CheckoutCart;
}

export async function listPaymentProviders(): Promise<PaymentProvider[]> {
  const { payment_providers } = await sdk.store.payment.listPaymentProviders({
    region_id: BRAZIL_REGION_ID,
    fields: "id",
  });
  return payment_providers as PaymentProvider[];
}

export async function placeOrder(cartId: string, providerId: string): Promise<OrderReceipt> {
  return completeCheckoutAttempt(cartId, providerId, {
    retrieveCart: async (currentCartId) => {
      const currentCart = await retrieveCheckoutCart(currentCartId);
      if (!areCheckoutLineItemPricesAvailable(currentCart.items)) {
        throw new Error("O preço de um ou mais itens não pôde ser confirmado. Revise o carrinho.");
      }
      return currentCart;
    },
    initiatePaymentSession: async (currentCart, selectedProviderId) => {
      await sdk.store.payment.initiatePaymentSession(
        currentCart as Parameters<typeof sdk.store.payment.initiatePaymentSession>[0],
        { provider_id: selectedProviderId },
      );
    },
    completeCart: async (currentCartId) => {
      const result = await sdk.store.cart.complete(currentCartId, { fields: ORDER_FIELDS });
      if (result.type === "cart") {
        throw new Error("Não foi possível concluir o pedido. Seu carrinho foi preservado.");
      }

      return result.order as OrderReceipt;
    },
  });
}

export async function retrieveOrder(orderId: string): Promise<OrderReceipt> {
  const { order } = await sdk.store.order.retrieve(orderId, { fields: ORDER_FIELDS });
  return order as OrderReceipt;
}

export function storeOrderReceipt(order: OrderReceipt): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHECKOUT_CONFIRMATION_KEY, JSON.stringify(order));
  } catch {
    // The order response remains authoritative even when browser storage is unavailable.
  }
}

export function readStoredOrderReceipt(orderId: string): OrderReceipt | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(CHECKOUT_CONFIRMATION_KEY);
  if (!stored) return null;

  try {
    const order = JSON.parse(stored) as OrderReceipt;
    return order.id === orderId ? order : null;
  } catch {
    window.sessionStorage.removeItem(CHECKOUT_CONFIRMATION_KEY);
    return null;
  }
}
