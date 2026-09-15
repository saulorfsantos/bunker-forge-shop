import assert from "node:assert/strict";
import test from "node:test";
import {
  getMercadoPagoPublicKey,
  mountCardPaymentBrick,
} from "../src/lib/payments/mercado-pago-browser.ts";
import { PaymentContractError } from "../src/lib/payments/mercado-pago-contract.ts";

test("missing Mercado Pago public key fails closed before loading the SDK", async () => {
  let loaderCalls = 0;
  await assert.rejects(
    mountCardPaymentBrick({
      publicKey: "",
      containerId: "card-brick-test",
      amount: 1990,
      email: "buyer@example.invalid",
      onReady: () => {},
      onSubmit: async () => {},
      onError: () => {},
      loadSdk: async () => {
        loaderCalls += 1;
        throw new Error("must not load");
      },
    }),
    PaymentContractError,
  );
  assert.equal(loaderCalls, 0);
  assert.equal(getMercadoPagoPublicKey(), null);
});

test("card SDK is mockable and receives only public initialization plus callbacks", async () => {
  const calls = [];
  const controller = { unmount: async () => calls.push(["unmount"]) };
  class MockMercadoPago {
    constructor(publicKey, options) {
      calls.push(["construct", publicKey, options]);
    }

    bricks() {
      return {
        create: async (...args) => {
          calls.push(["create", ...args]);
          return controller;
        },
      };
    }
  }

  const mounted = await mountCardPaymentBrick({
    publicKey: "PUBLIC-structural-placeholder",
    containerId: "card-brick-test",
    amount: 1990,
    email: "buyer@example.invalid",
    onReady: () => {},
    onSubmit: async () => {},
    onError: () => {},
    loadSdk: async () => MockMercadoPago,
  });

  assert.equal(mounted, controller);
  assert.deepEqual(calls[0], ["construct", "PUBLIC-structural-placeholder", { locale: "pt-BR" }]);
  assert.equal(calls[1][0], "create");
  assert.equal(calls[1][1], "cardPayment");
  assert.equal(calls[1][2], "card-brick-test");
  assert.deepEqual(calls[1][3].initialization, {
    amount: 1990,
    payer: { email: "buyer@example.invalid" },
  });
  assert.equal(typeof calls[1][3].callbacks.onSubmit, "function");
});
