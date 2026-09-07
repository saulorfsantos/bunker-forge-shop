import assert from "node:assert/strict";
import test from "node:test";
import {
  mapMedusaProduct,
  mapMedusaVariant,
  resolveProductImages,
  resolveSelectedVariant,
  type MedusaProduct,
} from "./catalog.ts";

const productBase: MedusaProduct = {
  id: "prod_test",
  title: "Produto com variantes",
  handle: "produto-com-variantes",
  categories: [{ id: "cat_test", handle: "airsoft", name: "Airsoft" }],
};

test("multiple variants require an explicit choice and use the lowest available real price", () => {
  const product = mapMedusaProduct(
    {
      ...productBase,
      variants: [
        {
          id: "variant_first",
          sku: "SKU-FIRST",
          manage_inventory: true,
          inventory_quantity: 3,
          calculated_price: { calculated_amount: 200, original_amount: 200 },
        },
        {
          id: "variant_cheapest",
          sku: "SKU-CHEAPEST",
          manage_inventory: true,
          inventory_quantity: 8,
          calculated_price: { calculated_amount: 150, original_amount: 180 },
        },
      ],
    },
    "placeholder.png",
  );

  assert.equal(product.requiresVariantSelection, true);
  assert.equal(product.defaultVariantId, undefined);
  assert.equal(product.currentPrice, 150);
  assert.equal(product.price1, 180);
  assert.equal(product.sku, "SKU-CHEAPEST");
  assert.equal(product.stock, 11);
  assert.equal(product.isAvailable, true);
});

test("selection never falls back to the first variant when more than one exists", () => {
  const variants = [{ id: "variant_first" }, { id: "variant_selected" }];

  assert.equal(resolveSelectedVariant(variants, null), undefined);
  assert.equal(resolveSelectedVariant(variants, "variant_selected")?.id, "variant_selected");
  assert.equal(resolveSelectedVariant([{ id: "variant_only" }], null)?.id, "variant_only");
});

test("managed inventory at zero is unavailable unless backorders are explicitly enabled", () => {
  const unavailable = mapMedusaVariant({
    id: "variant_zero",
    manage_inventory: true,
    inventory_quantity: 0,
    allow_backorder: false,
    calculated_price: { calculated_amount: 100 },
  });
  const backorder = mapMedusaVariant({
    id: "variant_backorder",
    manage_inventory: true,
    inventory_quantity: 0,
    allow_backorder: true,
    calculated_price: { calculated_amount: 100 },
  });

  assert.equal(unavailable.stock, 0);
  assert.equal(unavailable.isAvailable, false);
  assert.equal(backorder.stock, 0);
  assert.equal(backorder.isAvailable, true);
  assert.equal(backorder.allowBackorder, true);
});

test("unmanaged inventory is available without inventing a stock quantity", () => {
  const variant = mapMedusaVariant({
    id: "variant_unmanaged",
    manage_inventory: false,
    inventory_quantity: 0,
    calculated_price: { calculated_amount: 90 },
  });

  assert.equal(variant.stock, null);
  assert.equal(variant.isAvailable, true);
});

test("missing inventory scope and missing calculated price never become stock or a zero-price offer", () => {
  const variant = mapMedusaVariant({
    id: "variant_unknown",
    manage_inventory: true,
    inventory_quantity: null,
  });

  assert.equal(variant.stock, null);
  assert.equal(variant.isAvailable, false);
  assert.equal(variant.priceAvailable, false);
});

test("an unavailable variant price is not advertised for an available variant without a price", () => {
  const product = mapMedusaProduct(
    {
      ...productBase,
      variants: [
        {
          id: "variant_unavailable_with_price",
          manage_inventory: true,
          inventory_quantity: 0,
          calculated_price: { calculated_amount: 50 },
        },
        {
          id: "variant_available_without_price",
          manage_inventory: true,
          inventory_quantity: 2,
        },
      ],
    },
    "placeholder.png",
  );

  assert.equal(product.isAvailable, true);
  assert.equal(product.priceAvailable, false);
});

test("product images preserve backend order and use fallbacks only when no real image exists", () => {
  assert.deepEqual(
    resolveProductImages(
      {
        ...productBase,
        thumbnail: "thumbnail.jpg",
        images: [{ url: "front.jpg" }, { url: "detail.jpg" }],
      },
      "placeholder.png",
    ),
    ["front.jpg", "detail.jpg"],
  );
  assert.deepEqual(
    resolveProductImages({ ...productBase, thumbnail: "thumbnail.jpg" }, "placeholder.png"),
    ["thumbnail.jpg"],
  );
  assert.deepEqual(resolveProductImages(productBase, "placeholder.png"), ["placeholder.png"]);
});
