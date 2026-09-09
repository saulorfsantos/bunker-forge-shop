import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOrderDisplayLabel,
  getOrderStatusLabel,
  getPaymentOptionLabel,
} from "../src/lib/checkout-copy.ts";

const checkoutSource = readFileSync(new URL("../src/routes/checkout.tsx", import.meta.url), "utf8");
const confirmationSource = readFileSync(
  new URL("../src/routes/order-confirmation.tsx", import.meta.url),
  "utf8",
);

test("payment options use customer-facing labels without exposing internal identifiers", () => {
  assert.equal(getPaymentOptionLabel("pp_system_default"), "Pagamento a combinar");
  assert.equal(getPaymentOptionLabel("pp_internal_example"), "Pagamento a combinar");
});

test("order statuses describe the order without implying a completed payment", () => {
  assert.equal(getOrderStatusLabel("pending"), "Pedido pendente");
  assert.equal(getOrderStatusLabel("completed"), "Pedido registrado");
  assert.equal(getOrderStatusLabel("processing"), "Pedido em preparação");
  assert.equal(getOrderStatusLabel("requires_action"), "Aguardando ação");
  assert.equal(getOrderStatusLabel("canceled"), "Pedido cancelado");
  assert.equal(getOrderStatusLabel(undefined), "Status indisponível");
});

test("unknown order statuses use a neutral fallback without exposing internal values", () => {
  assert.equal(getOrderStatusLabel("internal_review_queue"), "Status indisponível");
});

test("order identification never falls back to the internal order id", () => {
  assert.equal(getOrderDisplayLabel(123), "#123");
  assert.equal(getOrderDisplayLabel(undefined), "Identificação indisponível");
});

test("checkout copy states that no charge occurs and does not suggest a later card step", () => {
  assert.match(checkoutSource, /Nenhuma cobrança é realizada neste checkout\./);
  assert.match(checkoutSource, /o pagamento continuará pendente/);
  assert.doesNotMatch(checkoutSource, /dados de cartão/i);
  assert.doesNotMatch(checkoutSource, /processado com segurança/i);
});

test("confirmation distinguishes a registered order from an unpaid order", () => {
  assert.match(confirmationSource, /Pedido registrado/);
  assert.match(confirmationSource, /Nenhuma cobrança foi realizada neste momento\./);
  assert.match(confirmationSource, /entrará em contato para combinar o pagamento/);
  assert.doesNotMatch(confirmationSource, /Pedido confirmado com segurança/);
  assert.doesNotMatch(confirmationSource, /Referência: \{orderId\}/);
});
