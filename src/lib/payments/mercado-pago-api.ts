import {
  PaymentContractError,
  clearEphemeralCardToken,
  extractPaymentSession,
  type CardSessionData,
  type MercadoPagoCart,
  type MercadoPagoPaymentCollection,
  type MercadoPagoPaymentSession,
  type MercadoPagoProviderId,
  type PixSessionData,
} from "./mercado-pago-contract.ts";

const RESOURCE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const CART_FIELDS =
  "id,email,currency_code,total,*items,*payment_collection,*payment_collection.payment_sessions";
const ORDER_FIELDS = "id,display_id,email,currency_code,total,created_at,status,*items";

export interface MercadoPagoOrder {
  id: string;
  display_id?: number;
  email?: string;
  currency_code?: string;
  total?: number;
  created_at?: string;
  status?: string;
  items?: Array<{ id: string; title?: string; quantity: number; unit_price?: number }>;
}

export interface MercadoPagoStoreApi {
  retrieveCart: (cartId: string, signal?: AbortSignal) => Promise<MercadoPagoCart>;
  initiatePaymentSession: (
    cartId: string,
    providerId: MercadoPagoProviderId,
    data: CardSessionData | PixSessionData,
    signal?: AbortSignal,
  ) => Promise<{
    paymentCollection: MercadoPagoPaymentCollection;
    session: MercadoPagoPaymentSession;
  }>;
  retrievePaymentSession: (
    cartId: string,
    providerId: MercadoPagoProviderId,
    signal?: AbortSignal,
  ) => Promise<MercadoPagoPaymentSession>;
  completeCart: (cartId: string, signal?: AbortSignal) => Promise<MercadoPagoOrder>;
}

export class PaymentApiError extends Error {
  readonly recoverable: boolean;

  constructor(message: string, recoverable = true) {
    super(message);
    this.name = "PaymentApiError";
    this.recoverable = recoverable;
  }
}

function validateResourceId(value: string, label: string): string {
  if (!RESOURCE_ID_PATTERN.test(value)) {
    throw new PaymentContractError(`${label} possui formato inválido.`);
  }
  return value;
}

function validateConfig(backendUrlValue: string, publishableKeyValue: string) {
  const publishableKey = publishableKeyValue.trim();
  if (!publishableKey) {
    throw new PaymentApiError("A chave pública da Store API não está configurada.", false);
  }

  let backendUrl: URL;
  try {
    backendUrl = new URL(backendUrlValue);
  } catch {
    throw new PaymentApiError("O endereço da Store API está inválido.", false);
  }
  if (
    !["http:", "https:"].includes(backendUrl.protocol) ||
    backendUrl.username ||
    backendUrl.password ||
    backendUrl.search ||
    backendUrl.hash
  ) {
    throw new PaymentApiError("O endereço da Store API não é seguro.", false);
  }
  const basePath = backendUrl.pathname === "/" ? "" : backendUrl.pathname.replace(/\/$/, "");
  return { backendUrl, basePath, publishableKey };
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PaymentApiError(`${label} não foi retornado pela Store API.`, false);
  }
  return value as Record<string, unknown>;
}

export function createMercadoPagoStoreApi(config: {
  backendUrl: string;
  publishableKey: string;
  fetchImpl?: typeof fetch;
}): MercadoPagoStoreApi {
  const { backendUrl, basePath, publishableKey } = validateConfig(
    config.backendUrl,
    config.publishableKey,
  );
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new PaymentApiError("O cliente HTTP da Store API não está disponível.", false);
  }

  const request = async (
    path: string,
    options: { method?: "GET" | "POST"; body?: unknown; signal?: AbortSignal } = {},
  ): Promise<Record<string, unknown>> => {
    if (!path.startsWith("/store/") || path.includes("..") || path.includes("\\")) {
      throw new PaymentContractError("A rota solicitada não pertence à Store API permitida.");
    }
    const target = new URL(`${basePath}${path}`, `${backendUrl.origin}/`);
    const method = options.method ?? "GET";
    const headers: Record<string, string> = {
      Accept: "application/json",
      "x-publishable-api-key": publishableKey,
    };
    let body: string | undefined;
    if (options.body !== undefined) {
      if (method !== "POST") {
        throw new PaymentContractError("Apenas operações POST da Store API podem enviar JSON.");
      }
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await fetchImpl(target.href, {
        method,
        headers,
        ...(body ? { body } : {}),
        signal: options.signal,
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new PaymentApiError("Não foi possível consultar a Store API. Tente novamente.");
    } finally {
      body = undefined;
    }
    if (!response.ok) {
      const recoverable =
        response.status >= 500 || response.status === 408 || response.status === 429;
      throw new PaymentApiError(
        `A Store API recusou a operação de pagamento (HTTP ${response.status}).`,
        recoverable,
      );
    }
    try {
      return requireObject(await response.json(), "A resposta JSON");
    } catch (error) {
      if (error instanceof PaymentApiError) throw error;
      throw new PaymentApiError("A Store API retornou uma resposta inválida.", false);
    }
  };

  const retrieveCart = async (cartId: string, signal?: AbortSignal): Promise<MercadoPagoCart> => {
    const id = validateResourceId(cartId, "O carrinho");
    const query = new URLSearchParams({ fields: CART_FIELDS });
    const response = await request(`/store/carts/${id}?${query}`, { signal });
    const cart = requireObject(response.cart, "O carrinho") as unknown as MercadoPagoCart;
    if (cart.id !== id) {
      throw new PaymentApiError("A Store API retornou um carrinho diferente.", false);
    }
    if (cart.currency_code && cart.currency_code.toLowerCase() !== "brl") {
      throw new PaymentApiError("O carrinho não está configurado em BRL.", false);
    }
    return cart;
  };

  const ensurePaymentCollection = async (
    cart: MercadoPagoCart,
    signal?: AbortSignal,
  ): Promise<MercadoPagoPaymentCollection> => {
    if (cart.payment_collection) {
      validateResourceId(cart.payment_collection.id, "A cobrança");
      return cart.payment_collection;
    }
    const response = await request("/store/payment-collections", {
      method: "POST",
      body: { cart_id: validateResourceId(cart.id, "O carrinho") },
      signal,
    });
    const collection = requireObject(
      response.payment_collection,
      "A cobrança",
    ) as unknown as MercadoPagoPaymentCollection;
    validateResourceId(collection.id, "A cobrança");
    return collection;
  };

  return {
    retrieveCart,

    async initiatePaymentSession(cartId, providerId, data, signal) {
      const cart = await retrieveCart(cartId, signal);
      const collection = await ensurePaymentCollection(cart, signal);
      try {
        const response = await request(
          `/store/payment-collections/${validateResourceId(collection.id, "A cobrança")}/payment-sessions`,
          {
            method: "POST",
            body: { provider_id: providerId, data },
            signal,
          },
        );
        const returnedCollection = requireObject(
          response.payment_collection,
          "A cobrança atualizada",
        ) as unknown as MercadoPagoPaymentCollection;
        validateResourceId(returnedCollection.id, "A cobrança atualizada");
        const session = extractPaymentSession(returnedCollection, providerId);
        if (!session) {
          throw new PaymentApiError("A Store API não retornou a sessão iniciada.", false);
        }
        return { paymentCollection: returnedCollection, session };
      } finally {
        clearEphemeralCardToken(data);
      }
    },

    async retrievePaymentSession(cartId, providerId, signal) {
      const cart = await retrieveCart(cartId, signal);
      const session = extractPaymentSession(cart.payment_collection, providerId);
      if (!session) {
        throw new PaymentApiError("A sessão de pagamento não está mais disponível.", false);
      }
      return session;
    },

    async completeCart(cartId, signal) {
      const id = validateResourceId(cartId, "O carrinho");
      const query = new URLSearchParams({ fields: ORDER_FIELDS });
      const response = await request(`/store/carts/${id}/complete?${query}`, {
        method: "POST",
        signal,
      });
      if (response.type === "cart") {
        throw new PaymentApiError(
          "O backend ainda não autorizou a conclusão do pedido. Consulte o pagamento novamente.",
        );
      }
      if (response.type !== "order") {
        throw new PaymentApiError("O backend não confirmou a conclusão do carrinho.", false);
      }
      const order = requireObject(response.order, "O pedido") as unknown as MercadoPagoOrder;
      validateResourceId(order.id, "O pedido");
      return order;
    },
  };
}
