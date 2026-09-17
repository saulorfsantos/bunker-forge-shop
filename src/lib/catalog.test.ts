import assert from "node:assert/strict";
import test from "node:test";
import {
  mapMedusaProduct,
  mapMedusaVariant,
  resolveProductImages,
  resolveSelectedVariant,
  type MedusaProduct,
} from "./catalog.ts";
import { mapLineItemToProduct } from "./cart-product.ts";
import {
  createLocalProductImageResolver,
  createProductImageManifest,
} from "./product-image-resolver.ts";

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

test("an explicit selection changes the variant id, SKU, and price used for cart input", () => {
  const variants = [
    mapMedusaVariant({
      id: "variant_black",
      sku: "SKU-BLACK",
      title: "Preto",
      manage_inventory: true,
      inventory_quantity: 2,
      calculated_price: { calculated_amount: 250 },
    }),
    mapMedusaVariant({
      id: "variant_tan",
      sku: "SKU-TAN",
      title: "Tan",
      manage_inventory: true,
      inventory_quantity: 4,
      calculated_price: { calculated_amount: 275 },
    }),
  ];

  assert.equal(resolveSelectedVariant(variants, null), undefined);
  const black = resolveSelectedVariant(variants, "variant_black");
  const tan = resolveSelectedVariant(variants, "variant_tan");
  assert.deepEqual(
    black && { cartVariantId: black.id, sku: black.sku, price: black.currentPrice },
    { cartVariantId: "variant_black", sku: "SKU-BLACK", price: 250 },
  );
  assert.deepEqual(tan && { cartVariantId: tan.id, sku: tan.sku, price: tan.currentPrice }, {
    cartVariantId: "variant_tan",
    sku: "SKU-TAN",
    price: 275,
  });
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

const localManifest = createProductImageManifest({
  "../assets/products/produto-com-variantes/10.png": "/assets/10.png",
  "../assets/products/produto-com-variantes/02.jpeg": "/assets/02.jpeg",
  "../assets/products/produto-com-variantes/01.webp": "/assets/01.webp",
  "../assets/products/prod_by_id/01.jpg": "/assets/by-id.jpg",
  "../assets/products/produto-com-variantes/vector.svg": "/assets/vector.svg",
  "../assets/products/produto-com-variantes/nested/03.jpg": "/assets/nested.jpg",
});
const resolveLocalImages = createLocalProductImageResolver(localManifest);

test("Medusa images preserve backend order and win over local images", () => {
  assert.deepEqual(
    resolveProductImages(
      {
        ...productBase,
        thumbnail: "thumbnail.jpg",
        images: [{ url: "front.jpg" }, { url: "detail.jpg" }],
      },
      "placeholder.png",
      resolveLocalImages,
    ),
    ["front.jpg", "detail.jpg"],
  );
});

test("Medusa thumbnail wins over local images", () => {
  assert.deepEqual(
    resolveProductImages(
      { ...productBase, thumbnail: "thumbnail.jpg" },
      "placeholder.png",
      resolveLocalImages,
    ),
    ["thumbnail.jpg"],
  );
});

test("local images resolve by handle before the product id and sort 01, 02, 10", () => {
  assert.equal(Object.getPrototypeOf(localManifest), null);
  assert.deepEqual(resolveProductImages(productBase, "placeholder.png", resolveLocalImages), [
    "/assets/01.webp",
    "/assets/02.jpeg",
    "/assets/10.png",
  ]);
});

test("local images use the product id as an alias when the handle has no assets", () => {
  assert.deepEqual(
    resolveProductImages(
      { ...productBase, id: "prod_by_id", handle: "handle-without-assets" },
      "placeholder.png",
      resolveLocalImages,
    ),
    ["/assets/by-id.jpg"],
  );
});

test("placeholder is preserved when Medusa and the local manifest have no image", () => {
  assert.deepEqual(
    resolveProductImages(
      { ...productBase, id: "missing", handle: "also-missing" },
      "placeholder.png",
      resolveLocalImages,
    ),
    ["placeholder.png"],
  );
});

test("__proto__ never resolves an inherited manifest property", () => {
  const resolver = createLocalProductImageResolver({});
  assert.deepEqual(resolver({ handle: "__proto__" }), []);
});

test("constructor never resolves an inherited manifest property", () => {
  const resolver = createLocalProductImageResolver({});
  assert.deepEqual(resolver({ handle: "constructor" }), []);
});

test("cart products use the same local fallback by handle and by id", () => {
  const byHandle = mapLineItemToProduct(
    {
      id: "item_handle",
      product_id: "missing-id",
      variant_id: "variant_handle",
      quantity: 1,
      product: { handle: "produto-com-variantes" },
    },
    "placeholder.png",
    resolveLocalImages,
  );
  const byId = mapLineItemToProduct(
    {
      id: "item_id",
      product_id: "prod_by_id",
      variant_id: "variant_id",
      quantity: 1,
      product: { handle: "missing-handle" },
    },
    "placeholder.png",
    resolveLocalImages,
  );

  assert.deepEqual(byHandle.images, ["/assets/01.webp", "/assets/02.jpeg", "/assets/10.png"]);
  assert.deepEqual(byId.images, ["/assets/by-id.jpg"]);
});

test("cart products preserve the placeholder when no local fallback exists", () => {
  const product = mapLineItemToProduct(
    {
      id: "item_missing",
      product_id: "missing-id",
      variant_id: "variant_missing",
      quantity: 1,
      product: { handle: "missing-handle" },
    },
    "placeholder.png",
    resolveLocalImages,
  );

  assert.deepEqual(product.images, ["placeholder.png"]);
});
