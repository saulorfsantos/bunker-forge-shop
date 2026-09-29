import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  loadCalculatedShippingPrices,
  shippingOptionPriceLabel,
} from "../src/lib/shipping-quotes.ts";

const checkout = readFileSync(new URL("../src/lib/checkout.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/routes/checkout.tsx", import.meta.url), "utf8");

test("calculated options show the quoted price, never their listed amount", () => {
  const option = { id: "pac", price_type: "calculated", amount: 999 };
  assert.equal(shippingOptionPriceLabel(option, undefined), "Calculando...");
  assert.equal(shippingOptionPriceLabel(option, 24.5), "R$ 24,50");
  assert.equal(shippingOptionPriceLabel(option, null), "Cotação indisponível");
});

test("fixed and pickup options retain their own amounts including zero", () => {
  assert.equal(
    shippingOptionPriceLabel({ id: "pickup", price_type: "flat", amount: 0 }, undefined),
    "R$ 0,00",
  );
  assert.equal(shippingOptionPriceLabel({ id: "fixed", amount: 12 }, undefined), "R$ 12,00");
});

test("a failed quote does not break other options or add a shipping method", async () => {
  const calls = [];
  const results = new Map();
  await loadCalculatedShippingPrices(
    "cart_1",
    [
      { id: "pac", price_type: "calculated" },
      { id: "pickup", price_type: "flat", amount: 0 },
      { id: "sedex", price_type: "calculated" },
    ],
    async (cartId, optionId) => {
      calls.push([cartId, optionId]);
      if (optionId === "pac") throw new Error("quote failed");
      return 35;
    },
    (id, amount) => results.set(id, amount),
  );
  assert.deepEqual(calls, [
    ["cart_1", "pac"],
    ["cart_1", "sedex"],
  ]);
  assert.equal(results.get("pac"), null);
  assert.equal(results.get("sedex"), 35);
  assert.equal(results.has("pickup"), false);
});

test("quotes use the official calculate route; addShippingMethod remains submit-only", () => {
  assert.match(
    checkout,
    /sdk\.store\.fulfillment\.calculate\(optionId, \{\s*cart_id: cartId,\s*data: \{\},/,
  );
  assert.match(
    page,
    /loadCalculatedShippingPrices\(\s*cartId,\s*shippingOptions,\s*calculateShippingOptionPrice,/,
  );
  assert.match(
    page,
    /const submitShipping = async[\s\S]*?selectShippingOption\(cart\.id, shippingOptionId\)/,
  );
  assert.match(
    checkout,
    /export async function selectShippingOption[\s\S]*?sdk\.store\.cart\.addShippingMethod\(/,
  );
  assert.equal((checkout.match(/addShippingMethod\(/g) ?? []).length, 1);
  assert.doesNotMatch(page, /addShippingMethod\(/);
  assert.match(page, /<dt className="text-bunker-text-secondary">Frete<\/dt>/);
  assert.match(page, /Finalização da compra/);
  assert.match(page, /Finalizar pedido/);
});
