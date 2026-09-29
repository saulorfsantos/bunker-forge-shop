import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const routerSource = readSource("../src/router.tsx");
const productSource = readSource("../src/routes/product.$id.tsx");
const categorySource = readSource("../src/routes/category.$slug.tsx");
const headerSource = readSource("../src/components/Header.tsx");
const footerSource = readSource("../src/components/Footer.tsx");
const rootSource = readSource("../src/routes/__root.tsx");
const homeSource = readSource("../src/routes/index.tsx");

test("customer-visible error states are localized and retryable", () => {
  assert.match(routerSource, /Não foi possível carregar esta página/);
  assert.match(routerSource, /Tentar novamente/);
  assert.doesNotMatch(routerSource, /Something went wrong|An unexpected error|Try again|Go home/);
  assert.match(productSource, /Não foi possível carregar o produto/);
  assert.match(categorySource, /Catálogo temporariamente indisponível/);
  assert.match(productSource, /refetch/);
  assert.match(categorySource, /refetch/);
});

test("demo shell does not expose placeholder navigation or unsupported account controls", () => {
  assert.doesNotMatch(footerSource, /href="#"/);
  assert.doesNotMatch(headerSource, /aria-label="Conta"/);
  assert.doesNotMatch(headerSource, /<button[^>]+Favoritos/);
});

test("shell copy avoids an unqualified complete-inventory claim", () => {
  for (const source of [rootSource, homeSource, productSource, footerSource]) {
    assert.doesNotMatch(
      source,
      /arsenal completo|gear tático de verdade|alta performance|operações reais|também levaram/i,
    );
  }
});
