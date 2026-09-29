import assert from "node:assert/strict";
import test from "node:test";
import {
  createMercadoPagoStoreApi,
  PaymentApiError,
} from "../src/lib/payments/mercado-pago-api.ts";
import {
  MERCADO_PAGO_CARD_PROVIDER_ID,
  MERCADO_PAGO_PIX_PROVIDER_ID,
} from "../src/lib/payments/mercado-pago-contract.ts";

const backendUrl = "http://127.0.0.1:59009";
const publishableKey = "pk_structural_placeholder";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function session(providerId, status = "pending") {
  return {
    provider_id: providerId,
    status: "pending_authorization",
    data: { status },
  };
}

test("existing payment collection is reused and card request has only Store API headers", async () => {
  const calls = [];
  const data = {
    token: "ephemeral-token",
    payment_method_id: "visa",
    installments: 1,
    payer_email: "buyer@example.invalid",
  };
  const paymentSession = session(MERCADO_PAGO_CARD_PROVIDER_ID);
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (options.method === "GET") {
      return jsonResponse({
        cart: {
          id: "cart_local",
          total: 1990,
          currency_code: "brl",
          payment_collection: { id: "pay_col_local", payment_sessions: [] },
        },
      });
    }
    return jsonResponse({
      payment_collection: { id: "pay_col_local", payment_sessions: [paymentSession] },
    });
  };
  const api = createMercadoPagoStoreApi({ backendUrl, publishableKey, fetchImpl });

  const result = await api.initiatePaymentSession(
    "cart_local",
    MERCADO_PAGO_CARD_PROVIDER_ID,
    data,
  );
  assert.deepEqual(result.session, paymentSession);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /^http:\/\/127\.0\.0\.1:59009\/store\/carts\/cart_local\?/);
  assert.equal(
    calls[1].url,
    `${backendUrl}/store/payment-collections/pay_col_local/payment-sessions`,
  );
  assert.equal(calls[1].options.headers["x-publishable-api-key"], publishableKey);
  assert.equal(calls[1].options.headers["Content-Type"], "application/json");
  assert.equal(calls[1].options.credentials, "omit");
  assert.equal(calls[1].options.redirect, "error");
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    provider_id: MERCADO_PAGO_CARD_PROVIDER_ID,
    data: {
      token: "ephemeral-token",
      payment_method_id: "visa",
      installments: 1,
      payer_email: "buyer@example.invalid",
    },
  });
  assert.equal(data.token, "");
  assert.equal(
    calls.some(({ url }) => url.endsWith("/store/payment-collections")),
    false,
  );
});

test("a payment collection is created when the authoritative cart has none", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) {
      return jsonResponse({
        cart: { id: "cart_local", total: 1990, currency_code: "brl", payment_collection: null },
      });
    }
    if (calls.length === 2) {
      return jsonResponse({ payment_collection: { id: "pay_col_local" } });
    }
    return jsonResponse({
      payment_collection: {
        id: "pay_col_local",
        payment_sessions: [session(MERCADO_PAGO_PIX_PROVIDER_ID)],
      },
    });
  };
  const api = createMercadoPagoStoreApi({ backendUrl, publishableKey, fetchImpl });
  await api.initiatePaymentSession("cart_local", MERCADO_PAGO_PIX_PROVIDER_ID, {
    payer_email: "buyer@example.invalid",
    payer_identification: { type: "CPF", number: "00000000000" },
  });

  assert.equal(calls.length, 3);
  assert.equal(calls[1].url, `${backendUrl}/store/payment-collections`);
  assert.deepEqual(JSON.parse(calls[1].options.body), { cart_id: "cart_local" });
  assert.equal(
    calls[2].url,
    `${backendUrl}/store/payment-collections/pay_col_local/payment-sessions`,
  );
});

test("Pix to card to Pix starts a new backend session request for every selection", async () => {
  const sessionPosts = [];
  const fetchImpl = async (url, options) => {
    if (options.method === "GET") {
      return jsonResponse({
        cart: {
          id: "cart_local",
          total: 1990,
          currency_code: "brl",
          payment_collection: { id: "pay_col_local", payment_sessions: [] },
        },
      });
    }
    const body = JSON.parse(options.body);
    sessionPosts.push(body.provider_id);
    return jsonResponse({
      payment_collection: {
        id: "pay_col_local",
        payment_sessions: [session(body.provider_id)],
      },
    });
  };
  const api = createMercadoPagoStoreApi({ backendUrl, publishableKey, fetchImpl });
  const pixData = {
    payer_email: "buyer@example.invalid",
    payer_identification: { type: "CPF", number: "00000000000" },
  };
  await api.initiatePaymentSession("cart_local", MERCADO_PAGO_PIX_PROVIDER_ID, pixData);
  await api.initiatePaymentSession("cart_local", MERCADO_PAGO_CARD_PROVIDER_ID, {
    token: "ephemeral-token",
    payment_method_id: "visa",
    installments: 1,
  });
  await api.initiatePaymentSession("cart_local", MERCADO_PAGO_PIX_PROVIDER_ID, pixData);

  assert.deepEqual(sessionPosts, [
    MERCADO_PAGO_PIX_PROVIDER_ID,
    MERCADO_PAGO_CARD_PROVIDER_ID,
    MERCADO_PAGO_PIX_PROVIDER_ID,
  ]);
});

test("Store API failures are surfaced without response-body or payment data logging", async () => {
  const api = createMercadoPagoStoreApi({
    backendUrl,
    publishableKey,
    fetchImpl: async () => jsonResponse({ internal: "must-not-surface" }, 503),
  });
  await assert.rejects(
    api.retrieveCart("cart_local"),
    (error) =>
      error instanceof PaymentApiError &&
      error.recoverable === true &&
      !error.message.includes("must-not-surface"),
  );
});

test("refresh reads the payment session from GET cart instead of browser memory", async () => {
  const paymentSession = session(MERCADO_PAGO_PIX_PROVIDER_ID, "authorized");
  const api = createMercadoPagoStoreApi({
    backendUrl,
    publishableKey,
    fetchImpl: async () =>
      jsonResponse({
        cart: {
          id: "cart_local",
          currency_code: "brl",
          payment_collection: { id: "pay_col_local", payment_sessions: [paymentSession] },
        },
      }),
  });
  assert.deepEqual(
    await api.retrievePaymentSession("cart_local", MERCADO_PAGO_PIX_PROVIDER_ID),
    paymentSession,
  );
});

test("cart completion accepts only a backend order and supports an idempotent order response", async () => {
  let calls = 0;
  const api = createMercadoPagoStoreApi({
    backendUrl,
    publishableKey,
    fetchImpl: async (url, options) => {
      calls += 1;
      assert.match(url, /\/store\/carts\/cart_local\/complete\?/);
      assert.equal(options.method, "POST");
      return jsonResponse({ type: "order", order: { id: "order_local", total: 1990 } });
    },
  });
  assert.equal((await api.completeCart("cart_local")).id, "order_local");
  assert.equal((await api.completeCart("cart_local")).id, "order_local");
  assert.equal(calls, 2);

  const pendingApi = createMercadoPagoStoreApi({
    backendUrl,
    publishableKey,
    fetchImpl: async () => jsonResponse({ type: "cart", cart: { id: "cart_local" } }),
  });
  await assert.rejects(pendingApi.completeCart("cart_local"), PaymentApiError);
});

test("missing Store API configuration fails closed before fetch", () => {
  assert.throws(
    () => createMercadoPagoStoreApi({ backendUrl, publishableKey: "", fetchImpl: async () => {} }),
    PaymentApiError,
  );
  assert.throws(
    () =>
      createMercadoPagoStoreApi({
        backendUrl: "javascript:unsafe",
        publishableKey,
        fetchImpl: async () => {},
      }),
    PaymentApiError,
  );
});
