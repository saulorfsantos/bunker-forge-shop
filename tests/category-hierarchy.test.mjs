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

test("home opens with the photo slide plus the six approved artworks", () => {
  assert.match(homeSource, /<HeroCarousel slides=\{HERO_SLIDES\} \/>/);
  assert.doesNotMatch(homeSource, /MEDUSA_CATEGORY_IDS/);
  const ids = [...slidesSource.matchAll(/^    id: "([^"]+)"/gm)].map((m) => m[1]);
  assert.deepEqual(ids, [
    "armas-airsoft",
    "colete-tatico-modular",
    "rossi-shield",
    "mira-rossi-558",
    "bbs-tracer-leao",
    "tracer-t238-griffon",
    "wardog-loadout",
  ]);
  assert.match(slidesSource, /link: \{ type: "category", handle: "coletes-modulares" \}/);
  assert.match(slidesSource, /link: \{ type: "product", id: "prod_01M3WFB296PY97KYF7902P2R7W" \}/);
  assert.match(slidesSource, /link: \{ type: "product", id: "prod_01KW4KQ8MFG929EJA1BANDTBYK" \}/);
  assert.equal([...slidesSource.matchAll(/mobile: \w+Mobile/g)].length, 6);
  assert.match(carouselSource, /to="\/product\/\$id" params=\{\{ id: slide\.link\.id \}\}/);
  assert.match(carouselSource, /prefers-reduced-motion: reduce/);
  assert.match(carouselSource, /aria-roledescription="carousel"/);
});

test("menu keeps only top-level categories even when the SDK drops the parent filter", () => {
  assert.match(hookSource, /parent_category_id,\*category_children/);
  assert.match(hookSource, /\.filter\(\(category\) => !category\.parent_category_id\)/);
});

test("palette is Adriano's five colours and the menu is tan/carvão, 20% larger", () => {
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  for (const token of [
    "--palette-carvao: #111111;",
    "--palette-tan: #b98a50;",
    "--palette-offwhite: #f2e9da;",
    "--palette-grafite: #2a2a2a;",
    "--palette-dourado: #d0a05a;",
    "--bunker-menu-bg: var(--palette-tan);",
    "--bunker-menu-text: var(--palette-carvao);",
    "--bunker-menu-hover-bg: var(--palette-carvao);",
    "--bunker-menu-hover-text: var(--palette-dourado);",
  ]) {
    assert.ok(styles.includes(token), token);
  }
  // 13.8px / 16.1px (17/10) + 20%.
  assert.match(headerSource, /text-\[16\.56px\] xl:text-\[19\.32px\]/);
  assert.match(headerSource, /<nav className="bg-bunker-menu /);
  assert.match(
    headerSource,
    /text-bunker-menu-text hover:bg-bunker-menu-hover hover:text-bunker-menu-hover-text/,
  );
  assert.match(headerSource, /max-w-\[1610px\]/);
  // Components use tokens, never raw hex values.
  for (const path of ["../src/components/Header.tsx", "../src/components/ProductCard.tsx"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /#[0-9a-f]{6}\b/i, path);
  }
});

test("carousel shows finished artwork with a mobile version and a link", () => {
  assert.match(carouselSource, /slide\.art \?/);
  assert.match(
    carouselSource,
    /<source media="\(max-width: 1023px\)" srcSet=\{slide\.art\.mobile\}/,
  );
  // Same box for photo and artwork slides, so the page does not jump between slides.
  assert.equal([...carouselSource.matchAll(/aspect-square lg:aspect-\[3\/1\]/g)].length, 2);
  assert.match(carouselSource, /width=\{1920\}\s+height=\{640\}/);
  assert.match(slidesSource, /desktop 1920×640 \(3:1\), mobile 1080×1080/);
});
