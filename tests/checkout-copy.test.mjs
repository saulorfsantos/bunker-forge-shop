import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getOrderDisplayLabel,
  getOrderStatusLabel,
  getPaymentOptionLabel,
} from "../src/lib/checkout-copy.ts";

const checkoutSource = readFileSync(new URL("../src/routes/checkout.tsx", import.meta.url), "utf8");
const paymentSource = readFileSync(
  new URL("../src/components/checkout/MercadoPagoCheckout.tsx", import.meta.url),
  "utf8",
);
const confirmationSource = readFileSync(
  new URL("../src/routes/order-confirmation.tsx", import.meta.url),
  "utf8",
);
const cartSource = readFileSync(new URL("../src/routes/cart.tsx", import.meta.url), "utf8");

test("payment options use customer-facing labels without exposing internal identifiers", () => {
  assert.equal(getPaymentOptionLabel("pp_mercadopago-pix_mercadopago"), "Pix");
  assert.equal(getPaymentOptionLabel("pp_mercadopago-card_mercadopago"), "Cartão");
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

test("checkout copy presents Pix and browser-tokenized card as the primary payment path", () => {
  assert.match(checkoutSource, /MercadoPagoCheckout/);
  assert.match(paymentSource, /label="Pix"/);
  assert.match(paymentSource, /label="Cartão"/);
  assert.match(paymentSource, /Tokenização no navegador/);
  assert.doesNotMatch(checkoutSource, /pagamento continuará pendente/i);
  assert.doesNotMatch(paymentSource, /entrará em contato para combinar o pagamento/i);
});

test("confirmation is shown only after backend-confirmed payment and cart completion", () => {
  assert.match(confirmationSource, /Pedido registrado/);
  assert.match(confirmationSource, /Pagamento confirmado e pedido registrado\./);
  assert.doesNotMatch(confirmationSource, /Nenhuma cobrança foi realizada/i);
  assert.doesNotMatch(confirmationSource, /combinar o pagamento/i);
  assert.doesNotMatch(confirmationSource, /Referência: \{orderId\}/);
});

test("checkout presents store pickup as a factual receiving option", () => {
  assert.match(checkoutSource, /entrega ou retirada em loja/i);
  assert.match(checkoutSource, /Entrega ou retirada/);
  assert.match(checkoutSource, /Recebimento/);
  assert.match(cartSource, /O total final será confirmado após a seleção da entrega ou retirada\./);
  assert.doesNotMatch(cartSource, /Finalizar Compra/);
});

test("checkout bootstrap failure remains visible and states that the cart is preserved", () => {
  assert.match(checkoutSource, /Não foi possível abrir o checkout/);
  assert.match(checkoutSource, /Seu carrinho continua preservado\./);
  assert.match(checkoutSource, /Tentar novamente/);
});
