import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOptionSelectors,
  canSelectByOptions,
  displayBrand,
  findVariantForSelection,
  galleryForSelection,
  initialOptionSelection,
  selectOptionValue,
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

test("brand comes from Medusa metadata and unbranded products keep the store label", () => {
  const branded = mapMedusaProduct(
    {
      ...productBase,
      metadata: { brand: "  Specna Arms " },
      categories: [
        { id: "cat_parent", handle: "armas-airsoft", name: "Armas Airsoft" },
        { id: "cat_child", handle: "sniper-shotgun", name: "Sniper / Shotgun" },
      ],
    },
    "/placeholder.png",
  );
  assert.equal(branded.brand, "Specna Arms");
  assert.equal(displayBrand(branded), "Specna Arms");
  assert.deepEqual(branded.categoryHandles, ["armas-airsoft", "sniper-shotgun"]);
  assert.deepEqual(branded.categoryIds, ["cat_parent", "cat_child"]);

  for (const metadata of [undefined, null, {}, { brand: 42 }, { brand: "   " }]) {
    const product = mapMedusaProduct({ ...productBase, metadata }, "/placeholder.png");
    assert.equal(product.brand, "");
    assert.equal(displayBrand(product), "Bunker 81");
  }
});

// A vest sold in colours (front/back photo per colour) and, for the matrix cases, sizes.
const COR = "opt_cor";
const TAM = "opt_tam";
const vestOptions = [{ id: COR, title: "Cor", values: ["Preto", "Coyote", "Verde", "Multicam"] }];
const vestVariant = (
  id: string,
  cor: string,
  stock: number,
  images: string[],
  extra: Record<string, string> = {},
) =>
  mapMedusaVariant({
    id,
    sku: `SKU-${id}`,
    title: cor,
    manage_inventory: true,
    inventory_quantity: stock,
    calculated_price: { calculated_amount: 300, original_amount: 300 },
    images: images.map((url) => ({ url })),
    options: [
      { option_id: COR, value: cor },
      ...Object.entries(extra).map(([option_id, value]) => ({ option_id, value })),
    ],
  });
const vestVariants = [
  vestVariant("preto", "Preto", 4, ["preto-frente.webp", "preto-costas.webp"]),
  vestVariant("coyote", "Coyote", 0, ["coyote-frente.webp", "coyote-costas.webp"]),
  vestVariant("verde", "Verde", 2, ["verde-frente.webp", "verde-costas.webp"]),
  vestVariant("multicam", "Multicam", 1, []),
];
const vestGallery = ["capa.webp", "preto-frente.webp", "coyote-frente.webp"];

test("variant images and option values are mapped from Medusa", () => {
  const variant = vestVariants[0];
  assert.deepEqual(variant.images, ["preto-frente.webp", "preto-costas.webp"]);
  assert.deepEqual(variant.optionValues, { [COR]: "Preto" });
  assert.deepEqual(mapMedusaVariant({ id: "v", thumbnail: "thumb.webp", images: [] }).images, [
    "thumb.webp",
  ]);
  assert.deepEqual(mapMedusaVariant({ id: "v" }).images, []);
  // Medusa may list a shared photo first; the colour's own thumbnail leads the gallery.
  assert.deepEqual(
    mapMedusaVariant({
      id: "v",
      thumbnail: "verde.webp",
      images: [{ url: "lado-a-lado.webp" }, { url: "verde.webp" }],
    }).images,
    ["verde.webp", "lado-a-lado.webp"],
  );
  assert.deepEqual(mapMedusaVariant({ id: "v" }).optionValues, {});
});

test("choosing a colour selects its variant, photos and stock", () => {
  assert.equal(canSelectByOptions(vestOptions, vestVariants), true);
  const selection = selectOptionValue(vestVariants, {}, COR, "Verde");
  const chosen = findVariantForSelection(vestOptions, vestVariants, selection);
  assert.equal(chosen?.id, "verde");
  assert.equal(chosen?.stock, 2);
  assert.deepEqual(galleryForSelection(vestGallery, vestVariants, chosen, selection), [
    "verde-frente.webp",
    "verde-costas.webp",
  ]);
});

test("nothing is chosen up front and the product gallery is shown", () => {
  const selectors = buildOptionSelectors(vestOptions, vestVariants, {});
  assert.deepEqual(initialOptionSelection(selectors), {});
  assert.equal(findVariantForSelection(vestOptions, vestVariants, {}), undefined);
  assert.deepEqual(galleryForSelection(vestGallery, vestVariants, undefined, {}), vestGallery);
});

test("an out-of-stock colour is flagged and cannot become purchasable", () => {
  const [cor] = buildOptionSelectors(vestOptions, vestVariants, {});
  assert.deepEqual(
    cor.values.map(({ value, purchasable }) => [value, purchasable]),
    [
      ["Preto", true],
      ["Coyote", false],
      ["Verde", true],
      ["Multicam", true],
    ],
  );
  const coyote = findVariantForSelection(vestOptions, vestVariants, { [COR]: "Coyote" });
  assert.equal(coyote?.isAvailable, false);
});

test("a colour without its own photos falls back to the product gallery", () => {
  const selection = { [COR]: "Multicam" };
  const chosen = findVariantForSelection(vestOptions, vestVariants, selection);
  assert.deepEqual(galleryForSelection(vestGallery, vestVariants, chosen, selection), vestGallery);
});

test("single-value options start chosen and colour photos show before the size", () => {
  const options = [...vestOptions, { id: TAM, title: "Tamanho", values: ["Único"] }];
  const variants = [
    vestVariant("preto-u", "Preto", 3, ["p1.webp", "p2.webp"], { [TAM]: "Único" }),
    vestVariant("verde-u", "Verde", 3, ["v1.webp", "v2.webp"], { [TAM]: "Único" }),
  ];
  const initial = initialOptionSelection(buildOptionSelectors(options, variants, {}));
  assert.deepEqual(initial, { [TAM]: "Único" });
  const selection = selectOptionValue(variants, initial, COR, "Verde");
  assert.equal(findVariantForSelection(options, variants, selection)?.id, "verde-u");

  const sized = [
    vestVariant("p-m", "Preto", 1, ["pm.webp"], { [TAM]: "M" }),
    vestVariant("p-g", "Preto", 1, ["pg.webp"], { [TAM]: "G" }),
    vestVariant("v-g", "Verde", 1, ["vg.webp"], { [TAM]: "G" }),
  ];
  const sizedOptions = [...vestOptions, { id: TAM, title: "Tamanho", values: ["M", "G"] }];
  const onlyColour = selectOptionValue(sized, {}, COR, "Preto");
  assert.equal(findVariantForSelection(sizedOptions, sized, onlyColour), undefined);
  assert.deepEqual(galleryForSelection(["capa.webp"], sized, undefined, onlyColour), ["pm.webp"]);
  // Verde only exists in G: picking it after Preto+M drops the impossible size.
  const conflicting = selectOptionValue(sized, { [COR]: "Preto", [TAM]: "M" }, COR, "Verde");
  assert.deepEqual(conflicting, { [COR]: "Verde" });
});

test("variants without a full option matrix keep the plain variant list", () => {
  const legacy = [
    mapMedusaVariant({ id: "a", title: "A" }),
    mapMedusaVariant({ id: "b", title: "B" }),
  ];
  assert.equal(canSelectByOptions(vestOptions, legacy), false);
  const duplicated = [vestVariants[0], vestVariant("preto-2", "Preto", 1, [])];
  assert.equal(canSelectByOptions(vestOptions, duplicated), false);
  assert.equal(canSelectByOptions(vestOptions, [vestVariants[0]]), false);
});

test("single-variant products keep the product gallery", () => {
  assert.deepEqual(
    galleryForSelection(vestGallery, [vestVariants[0]], vestVariants[0], {}),
    vestGallery,
  );
});
