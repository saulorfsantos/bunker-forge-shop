import assert from "node:assert/strict";
import test from "node:test";
import {
  appliedCouponCodes,
  cartItemAmounts,
  changeCartCoupon,
} from "../src/lib/cart-promotions.ts";

const base = { id: "cart_test", items: [{ unit_price: 56, quantity: 1 }], item_subtotal: 56 };
test("usa o total dos produtos e desconto retornados pelo servidor", () => {
  assert.deepEqual(
    cartItemAmounts({
      ...base,
      item_total: 2.8,
      item_discount_total: 53.2,
      total: 42.52,
      shipping_total: 39.72,
    }),
    { subtotal: 56, total: 2.8, discount: 53.2 },
  );
});
test("não adivinha desconto quando existe promoção sem total confirmado", () => {
  assert.equal(cartItemAmounts({ ...base, promotions: [{ code: "TESTE95" }] }).total, null);
  assert.equal(cartItemAmounts({ ...base, item_total: 0 }).total, 0);
  assert.equal(
    cartItemAmounts({ ...base, item_total: NaN, promotions: [{ code: "TESTE95" }] }).total,
    null,
  );
});
test("não apresenta código automático como cupom removível", () => {
  assert.deepEqual(
    appliedCouponCodes({
      ...base,
      promotions: [{ code: "AUTO", is_automatic: true }, { code: "TESTE95" }],
    }),
    ["TESTE95"],
  );
});
test("aplica código normalizado e preserva total autoritativo", async () => {
  let sent;
  const result = await changeCartCoupon(
    {
      retrieve: async () => base,
      add: async (id, code) => {
        sent = { id, code };
        return { ...base, item_total: 2.8, promotions: [{ code }] };
      },
    },
    base.id,
    " teste95 ",
    "add",
  );
  assert.deepEqual(sent, { id: base.id, code: "TESTE95" });
  assert.equal(result.item_total, 2.8);
});
test("não muda cupom de carrinho com pagamento pendente ou aprovado", async () => {
  for (const payment_collection of [
    { status: "authorized" },
    { status: "completed" },
    { payment_sessions: [{ status: "pending" }] },
  ]) {
    await assert.rejects(
      () =>
        changeCartCoupon(
          {
            retrieve: async () => ({ ...base, payment_collection }),
            add: () => assert.fail("não alterar valor de cobrança iniciada"),
          },
          base.id,
          "TESTE95",
          "add",
        ),
      /pagamento iniciado/,
    );
  }
});
test("recusa cupom ignorado pelo backend sem anunciar aplicação", async () => {
  await assert.rejects(
    () =>
      changeCartCoupon(
        { retrieve: async () => base, add: async () => ({ ...base, promotions: [] }) },
        base.id,
        "INVALIDO",
        "add",
      ),
    /não está válido/,
  );
});
test("remove cupom apenas pela API e usa o novo total do servidor", async () => {
  let sent;
  const result = await changeCartCoupon(
    {
      retrieve: async () => ({ ...base, promotions: [{ code: "TESTE95" }] }),
      remove: async (id, code) => {
        sent = { id, code };
        return { ...base, item_total: 56, promotions: [] };
      },
    },
    base.id,
    "teste95",
    "remove",
  );
  assert.equal(sent.code, "TESTE95");
  assert.equal(result.item_total, 56);
});
test("não aplica cupom em carrinho trocado nem envia entrada vazia", async () => {
  await assert.rejects(
    () =>
      changeCartCoupon(
        { retrieve: async () => ({ ...base, id: "cart_other" }), add: () => assert.fail() },
        base.id,
        "TESTE95",
        "add",
      ),
    /confirmar o carrinho/,
  );
  await assert.rejects(() => changeCartCoupon({}, base.id, " ", "add"), /válido/);
});
