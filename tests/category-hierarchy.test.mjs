import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  categoryIdsByHandle,
  collectCategoryIds,
  LEGACY_CATEGORY_HANDLES,
  mapMedusaCategory,
  sortCategoryNodes,
} from "../src/lib/category-hierarchy.ts";

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
  assert.match(hookSource, /rank/);
});

test("header links children to their own handle and hides empty dropdowns", () => {
  assert.match(headerSource, /params=\{\{ slug: cat\.slug \}\}/);
  assert.match(headerSource, /params=\{\{ slug: sub\.slug \}\}/);
  assert.match(
    headerSource,
    /cat\.subcategories\.length > 0 && \([\s\S]*?<div className="absolute top-full/,
  );
});

const categorySource = readFileSync(
  new URL("../src/routes/category.$slug.tsx", import.meta.url),
  "utf8",
);
const homeSource = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const slidesSource = readFileSync(new URL("../src/data/hero-slides.ts", import.meta.url), "utf8");
const carouselSource = readFileSync(
  new URL("../src/components/HeroCarousel.tsx", import.meta.url),
  "utf8",
);

const tree = [
  {
    id: "c3",
    name: "Suprimentos",
    handle: "suprimentos",
    rank: 2,
    category_children: [
      { id: "c3b", name: "Gás", handle: "gas", rank: 1 },
      { id: "c3a", name: "BBs", handle: "bbs", rank: 0 },
    ],
  },
  {
    id: "c1",
    name: "Armas Airsoft",
    handle: "armas-airsoft",
    rank: 0,
    category_children: [
      { id: "c1a", name: "Pistolas GBB / CO2", handle: "pistolas-gbb-co2", rank: 0 },
    ],
  },
  { id: "c2", name: "Airguns e Carabinas", handle: "airguns-carabinas", rank: 1 },
];

test("menu follows the Medusa rank on every level instead of the alphabet", () => {
  const sorted = sortCategoryNodes(tree);
  assert.deepEqual(
    sorted.map((node) => node.handle),
    ["armas-airsoft", "airguns-carabinas", "suprimentos"],
  );
  assert.deepEqual(
    mapMedusaCategory(sorted[2]).subcategories.map((sub) => sub.slug),
    ["bbs", "gas"],
  );
  const unranked = sortCategoryNodes([
    { id: "b", name: "Bravo", handle: "b" },
    { id: "a", name: "Alfa", handle: "a" },
  ]);
  assert.deepEqual(
    unranked.map((node) => node.handle),
    ["a", "b"],
  );
});

test("a parent tab lists its own products and every sub-item's products", () => {
  assert.deepEqual(collectCategoryIds(tree[0]), ["c3", "c3b", "c3a"]);
  assert.deepEqual(categoryIdsByHandle(tree, ["armas-airsoft", "gas"]).sort(), [
    "c1",
    "c1a",
    "c3b",
  ]);
  assert.deepEqual(categoryIdsByHandle(tree, ["inexistente"]), []);
  assert.match(categorySource, /collectCategoryIds\(categoryQuery\.data\)/);
  assert.match(categorySource, /include_descendants_tree: true/);
  assert.match(categorySource, /p\.categoryHandles\?\.includes\(sub\)/);
});

test("old menu links redirect to the renamed categories", () => {
  assert.deepEqual(LEGACY_CATEGORY_HANDLES, {
    airsoft: "armas-airsoft",
    pressao: "airguns-carabinas",
  });
  assert.match(
    categorySource,
    /beforeLoad[\s\S]*?LEGACY_CATEGORY_HANDLES\[params\.slug\][\s\S]*?redirect\(/,
  );
});

test("brand and sub-item filters only appear when there is something to filter", () => {
  assert.match(categorySource, /\.filter\(Boolean\)/);
  assert.match(
    categorySource,
    /category\.subcategories\.length > 0 && \(\s*<FilterBlock title="Subcategoria">/,
  );
  assert.match(categorySource, /brands\.length > 0 && \(\s*<FilterBlock title="Marca">/);
});

test("mobile menu scrolls and expands one tab at a time", () => {
  assert.match(headerSource, /max-h-\[75vh\] overflow-y-auto/);
  assert.match(headerSource, /aria-expanded=\{expandedCategory === cat\.slug\}/);
  assert.match(headerSource, /<nav className="[^"]*hidden lg:block/);
});

test("home opens with a five-banner carousel linked to menu categories", () => {
  assert.match(homeSource, /<HeroCarousel slides=\{HERO_SLIDES\} \/>/);
  assert.doesNotMatch(homeSource, /MEDUSA_CATEGORY_IDS/);
  const handles = [...slidesSource.matchAll(/categoryHandle: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(handles, [
    "armas-airsoft",
    "airguns-carabinas",
    "loadout",
    "magazines",
    "suprimentos",
  ]);
  assert.match(carouselSource, /prefers-reduced-motion: reduce/);
  assert.match(carouselSource, /aria-roledescription="carousel"/);
});
