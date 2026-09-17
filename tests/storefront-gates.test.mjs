import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("checkout renders and initializes only payment methods exposed by capabilities", () => {
  const checkout = readSource("../src/components/checkout/MercadoPagoCheckout.tsx");
  assert.match(checkout, /resolveMercadoPagoCapabilities\(availableProviderIds\)/);
  assert.match(checkout, /capabilities\.methods\.length === 0/);
  assert.match(checkout, /\{capabilities\.pix && \(/);
  assert.match(checkout, /\{capabilities\.card && \(/);
  assert.match(checkout, /setShouldMountCard\(initialMethod === "card"\)/);
});

test("PDP add-to-cart passes the explicitly selected variant id", () => {
  const productRoute = readSource("../src/routes/product.$id.tsx");
  assert.match(productRoute, /const selectedVariant = resolveSelectedVariant/);
  assert.match(productRoute, /if \(!selectedVariant\)[\s\S]*return;/);
  assert.match(productRoute, /await addItem\(selectedVariant\.id, qty\)/);
});

test("active dynamic product-image surfaces use the shared safe fallback", () => {
  for (const path of [
    "../src/components/ProductCard.tsx",
    "../src/routes/product.$id.tsx",
    "../src/routes/cart.tsx",
    "../src/components/Header.tsx",
  ]) {
    assert.match(readSource(path), /SafeProductImage/, path);
  }

  const safeImage = readSource("../src/components/SafeProductImage.tsx");
  assert.match(safeImage, /fallbackSrc = placeholderImage/);
  assert.match(safeImage, /onError=/);
  assert.match(safeImage, /setResolvedSrc\(fallbackSrc\)/);
});

test("active product media preserves the whole product without cover cropping", () => {
  const productCard = readSource("../src/components/ProductCard.tsx");
  const productRoute = readSource("../src/routes/product.$id.tsx");
  const cartRoute = readSource("../src/routes/cart.tsx");
  const header = readSource("../src/components/Header.tsx");

  assert.match(productCard, /SafeProductImage[\s\S]*object-contain p-3/);
  assert.match(productRoute, /SafeProductImage[\s\S]*object-contain p-1/);
  assert.match(productRoute, /SafeProductImage[\s\S]*object-contain p-4 md:p-6/);
  assert.match(cartRoute, /SafeProductImage[\s\S]*object-contain p-2/);
  assert.match(header, /SafeProductImage[\s\S]*object-contain p-1/);

  for (const source of [productCard, productRoute, cartRoute, header]) {
    assert.doesNotMatch(source, /SafeProductImage[\s\S]{0,300}object-cover/);
  }
});
