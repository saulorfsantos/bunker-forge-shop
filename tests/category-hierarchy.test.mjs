import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mapMedusaCategory } from "../src/lib/category-hierarchy.ts";

const hookSource = readFileSync(
  new URL("../src/hooks/useMedusaProducts.ts", import.meta.url),
  "utf8",
);
const headerSource = readFileSync(new URL("../src/components/Header.tsx", import.meta.url), "utf8");

test("maps only real children from a Medusa parent category", () => {
  const parent = mapMedusaCategory({
    id: "parent",
    name: "Acessórios Táticos",
    handle: "acessorios",
    category_children: [{ id: "child", name: "Bolsas", handle: "bolsas", category_children: [] }],
  });
  assert.equal(parent.slug, "acessorios");
  assert.deepEqual(parent.subcategories, [{ name: "Bolsas", slug: "bolsas" }]);
  assert.deepEqual(
    mapMedusaCategory({ id: "empty", name: "Airsoft", handle: "airsoft" }).subcategories,
    [],
  );
  assert.match(hookSource, /include_descendants_tree: true/);
  assert.match(hookSource, /parent_category_id: null/);
  assert.match(hookSource, /\*category_children/);
});

test("header links children to their own handle and hides empty dropdowns", () => {
  assert.match(headerSource, /params=\{\{ slug: cat\.slug \}\}/);
  assert.match(headerSource, /params=\{\{ slug: sub\.slug \}\}/);
  assert.match(
    headerSource,
    /cat\.subcategories\.length > 0 && \([\s\S]*?<div className="absolute top-full/,
  );
});
