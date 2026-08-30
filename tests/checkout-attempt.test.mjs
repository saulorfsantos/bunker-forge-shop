import assert from "node:assert/strict";
import test from "node:test";
import { completeCheckoutAttempt, createSubmissionLock } from "../src/lib/checkout-attempt.ts";

test("a retry uses the current cart and reuses its selected provider session", async () => {
  const calls = [];
  const staleCart = { id: "cart_1", payment_collection: null };
  const currentCart = {
    id: "cart_1",
    payment_collection: {
      id: "paycol_1",
      payment_sessions: [{ provider_id: "pp_existing" }],
    },
  };

  const order = await completeCheckoutAttempt(staleCart.id, "pp_existing", {
    retrieveCart: async (cartId) => {
      calls.push(["retrieve", cartId]);
      return currentCart;
    },
    initiatePaymentSession: async () => calls.push(["initiate"]),
    completeCart: async (cartId) => {
      calls.push(["complete", cartId]);
      return { id: "order_1" };
    },
  });

  assert.deepEqual(order, { id: "order_1" });
  assert.deepEqual(calls, [
    ["retrieve", "cart_1"],
    ["complete", "cart_1"],
  ]);
});

test("a missing selected provider session is initialized on the existing collection", async () => {
  const calls = [];
  const currentCart = {
    id: "cart_1",
    payment_collection: { id: "paycol_1", payment_sessions: [] },
  };

  await completeCheckoutAttempt(currentCart.id, "pp_new", {
    retrieveCart: async () => currentCart,
    initiatePaymentSession: async (cart, providerId) =>
      calls.push(["initiate", cart.payment_collection.id, providerId]),
    completeCart: async () => ({ id: "order_1" }),
  });

  assert.deepEqual(calls, [["initiate", "paycol_1", "pp_new"]]);
});

test("the submission lock rejects a same-tick duplicate and allows an explicit retry", () => {
  const lock = createSubmissionLock();

  assert.equal(lock.tryAcquire(), true);
  assert.equal(lock.tryAcquire(), false);
  lock.release();
  assert.equal(lock.tryAcquire(), true);
});
