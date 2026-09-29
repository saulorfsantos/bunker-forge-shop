import assert from "node:assert/strict";
import test from "node:test";
import { createMercadoPagoCheckoutLifecycle } from "../src/lib/payments/mercado-pago-lifecycle.ts";

test("incidental rerenders preserve active polling for the same cart", () => {
  const lifecycle = createMercadoPagoCheckoutLifecycle();
  let initializationCount = 0;
  let pollingController = null;

  const renderCheckout = (cartId, _renderProps) => {
    if (!lifecycle.beginCart(cartId)) return;
    pollingController?.abort();
    pollingController = new AbortController();
    initializationCount += 1;
  };

  renderCheckout("cart_active", { shippingQuote: undefined, onOrder: () => "first" });
  const activePolling = pollingController;

  renderCheckout("cart_active", { shippingQuote: 24.5, onOrder: () => "second" });
  renderCheckout("cart_active", { visualState: "expanded", onOrder: () => "third" });

  assert.equal(initializationCount, 1);
  assert.equal(pollingController, activePolling);
  assert.equal(activePolling.signal.aborted, false);
});

test("cart changes and unmount cleanup can terminate the active polling context", () => {
  const lifecycle = createMercadoPagoCheckoutLifecycle();
  let pollingController = null;

  const initializeCart = (cartId) => {
    if (!lifecycle.beginCart(cartId)) return;
    pollingController?.abort();
    pollingController = new AbortController();
  };

  initializeCart("cart_first");
  const firstPolling = pollingController;
  initializeCart("cart_second");

  assert.equal(firstPolling.signal.aborted, true);
  assert.equal(pollingController.signal.aborted, false);

  lifecycle.reset();
  pollingController.abort();

  assert.equal(pollingController.signal.aborted, true);
  assert.equal(lifecycle.beginCart("cart_second"), true);
});
