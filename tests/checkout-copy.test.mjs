import assert from "node:assert/strict";
import test from "node:test";
import { getOrderStatusLabel, getPaymentOptionLabel } from "../src/lib/checkout-copy.ts";

test("payment options use customer-facing labels without exposing internal identifiers", () => {
  assert.equal(getPaymentOptionLabel("pp_system_default"), "Pagamento");
  assert.equal(getPaymentOptionLabel("pp_internal_example"), "Forma de pagamento");
});

test("order statuses are shown in Portuguese", () => {
  assert.equal(getOrderStatusLabel("pending"), "Pendente");
  assert.equal(getOrderStatusLabel("completed"), "Concluído");
  assert.equal(getOrderStatusLabel("requires_action"), "Aguardando ação");
  assert.equal(getOrderStatusLabel("canceled"), "Cancelado");
  assert.equal(getOrderStatusLabel(undefined), "Pendente");
});

test("unknown order statuses do not expose raw internal values", () => {
  assert.equal(getOrderStatusLabel("internal_review_queue"), "Em processamento");
});
