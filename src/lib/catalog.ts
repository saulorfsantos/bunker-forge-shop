import type { Product } from "../types/product.ts";
import type { LocalProductImageResolver } from "./product-image-resolver.ts";

export type MedusaCalculatedPrice = {
  calculated_amount?: number | null;
  original_amount?: number | null;
};

export type MedusaVariant = {
  id: string;
  title?: string | null;
  sku?: string | null;
  manage_inventory?: boolean | null;
  allow_backorder?: boolean | null;
  inventory_quantity?: number | null;
  calculated_price?: MedusaCalculatedPrice | null;
  thumbnail?: string | null;
  variant_rank?: number | null;
  /** Requested on the product page only (`*variants.images`). */
  images?: Array<{ url?: string | null }> | null;
  /** Requested on the product page only (`*variants.options`). */
  options?: Array<{ value?: string | null; option_id?: string | null }> | null;
};

export type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string | null;
  description?: string | null;
  images?: Array<{ url?: string | null }>;
  categories?: Array<{ id: string; handle: string; name: string }>;
  metadata?: Record<string, unknown> | null;
  variants?: MedusaVariant[];
};

export const FALLBACK_BRAND_LABEL = "Bunker 81";

export function productBrand(product: Pick<MedusaProduct, "metadata">): string {
  const brand = product.metadata?.brand;
  return typeof brand === "string" ? brand.trim() : "";
}

/** Label shown on cards and pages; unbranded products keep the store name. */
export function displayBrand(product: Pick<Product, "brand">): string {
  return product.brand || FALLBACK_BRAND_LABEL;
}

export type CatalogVariant = {
  id: string;
  sku: string;
  title: string;
  currentPrice: number;
  originalPrice: number;
  priceAvailable: boolean;
  stock: number | null;
  isAvailable: boolean;
  allowBackorder: boolean;
  /** Photos attached to this variant in Medusa (e.g. one colour: front, back...). */
  images: string[];
  /** Option id → chosen value, e.g. { opt_cor: "Preto" }. */
  optionValues: Record<string, string>;
};

function imageUrls(images: Array<{ url?: string | null }> | null | undefined): string[] {
  const urls = (images ?? [])
    .map((image) => image.url?.trim())
    .filter((url): url is string => Boolean(url));
  return [...new Set(urls)];
}

export function mapMedusaVariant(variant: MedusaVariant): CatalogVariant {
  const managesInventory = variant.manage_inventory !== false;
  const stock = managesInventory
    ? typeof variant.inventory_quantity === "number"
      ? Math.max(0, variant.inventory_quantity)
      : null
    : null;
  const allowBackorder = variant.allow_backorder === true;
  const isAvailable = !managesInventory || (stock !== null && stock > 0) || allowBackorder;
  const calculatedAmount = variant.calculated_price?.calculated_amount;
  const priceAvailable = typeof calculatedAmount === "number";
  const currentPrice = priceAvailable ? calculatedAmount : 0;
  const originalAmount = variant.calculated_price?.original_amount;

  return {
    id: variant.id,
    sku: variant.sku ?? "",
    title: variant.title ?? "",
    currentPrice,
    originalPrice: typeof originalAmount === "number" ? originalAmount : currentPrice,
    priceAvailable,
    stock,
    isAvailable,
    allowBackorder,
    images: (() => {
      const urls = imageUrls(variant.images);
      const thumbnail = variant.thumbnail?.trim();
      if (!thumbnail) return urls;
      // The variant thumbnail is that colour's own photo: always show it first.
      return [thumbnail, ...urls.filter((url) => url !== thumbnail)];
    })(),
    optionValues: Object.fromEntries(
      (variant.options ?? [])
        .filter((option) => option.option_id && typeof option.value === "string")
        .map((option) => [option.option_id as string, option.value as string]),
    ),
  };
}

export function resolveSelectedVariant<T extends { id: string }>(
  variants: T[],
  selectedVariantId: string | null,
): T | undefined {
  if (variants.length === 1) return variants[0];
  if (!selectedVariantId) return undefined;
  return variants.find((variant) => variant.id === selectedVariantId);
}

export type CatalogOption = {
  id: string;
  title: string;
  values: string[];
};

export type OptionSelection = Record<string, string>;

export type OptionValueState = {
  value: string;
  /** Some variant with this value (and the other chosen values) can be bought now. */
  purchasable: boolean;
};

export type OptionSelector = {
  id: string;
  title: string;
  values: OptionValueState[];
};

const isPurchasable = (variant: CatalogVariant) => variant.isAvailable && variant.priceAvailable;

function matchesSelection(variant: CatalogVariant, selection: OptionSelection): boolean {
  return Object.entries(selection).every(
    ([optionId, value]) => variant.optionValues[optionId] === value,
  );
}

/**
 * Option pickers ("Cor", "Tamanho"...) can replace the plain variant list only when
 * every variant carries a value for every option and no two variants share the
 * same combination; otherwise the page keeps listing variants one by one.
 */
export function canSelectByOptions(options: CatalogOption[], variants: CatalogVariant[]): boolean {
  if (variants.length < 2 || options.length === 0) return false;
  const seen = new Set<string>();
  for (const variant of variants) {
    const key = options.map((option) => variant.optionValues[option.id]);
    if (key.some((value) => value === undefined)) return false;
    const serialized = JSON.stringify(key);
    if (seen.has(serialized)) return false;
    seen.add(serialized);
  }
  return true;
}

/** Values in Medusa's order, keeping only those some variant actually uses. */
export function buildOptionSelectors(
  options: CatalogOption[],
  variants: CatalogVariant[],
  selection: OptionSelection,
): OptionSelector[] {
  return options.map((option) => {
    const used = new Set(variants.map((variant) => variant.optionValues[option.id]));
    const ordered = [...option.values, ...used].filter(
      (value, index, all): value is string =>
        typeof value === "string" && used.has(value) && all.indexOf(value) === index,
    );
    const others = Object.fromEntries(
      Object.entries(selection).filter(([optionId]) => optionId !== option.id),
    );
    return {
      id: option.id,
      title: option.title,
      values: ordered.map((value) => ({
        value,
        purchasable: variants.some(
          (variant) =>
            variant.optionValues[option.id] === value &&
            matchesSelection(variant, others) &&
            isPurchasable(variant),
        ),
      })),
    };
  });
}

/** Options with a single value need no choice; start with them already chosen. */
export function initialOptionSelection(selectors: OptionSelector[]): OptionSelection {
  return Object.fromEntries(
    selectors
      .filter((selector) => selector.values.length === 1)
      .map((selector) => [selector.id, selector.values[0].value]),
  );
}

/**
 * Choose a value; earlier choices that no variant combines with it are dropped, so
 * the selection always points at variants that exist.
 */
export function selectOptionValue(
  variants: CatalogVariant[],
  selection: OptionSelection,
  optionId: string,
  value: string,
): OptionSelection {
  const next: OptionSelection = { ...selection, [optionId]: value };
  if (variants.some((variant) => matchesSelection(variant, next))) return next;
  const compatible: OptionSelection = Object.fromEntries(
    Object.entries(next).filter(
      ([id, chosen]) =>
        id === optionId ||
        variants.some(
          (variant) =>
            variant.optionValues[optionId] === value && variant.optionValues[id] === chosen,
        ),
    ),
  );
  if (variants.some((variant) => matchesSelection(variant, compatible))) return compatible;
  return { [optionId]: value };
}

/** The variant the customer is buying: only once every option has a value. */
export function findVariantForSelection(
  options: CatalogOption[],
  variants: CatalogVariant[],
  selection: OptionSelection,
): CatalogVariant | undefined {
  if (!options.every((option) => selection[option.id] !== undefined)) return undefined;
  return variants.find((variant) => matchesSelection(variant, selection));
}

/**
 * Photos to show for a (possibly partial) choice: the chosen variant's, else those
 * of the first variant matching what was chosen so far (picking a colour before a
 * size already shows that colour), else the product gallery.
 */
export function galleryForSelection(
  productImages: string[],
  variants: CatalogVariant[],
  chosen: CatalogVariant | undefined,
  selection: OptionSelection,
): string[] {
  if (variants.length < 2) return productImages;
  if (chosen?.images.length) return chosen.images;
  if (Object.keys(selection).length === 0) return productImages;
  const matching = variants.filter((variant) => matchesSelection(variant, selection));
  const withImages =
    matching.find((variant) => isPurchasable(variant) && variant.images.length > 0) ??
    matching.find((variant) => variant.images.length > 0);
  return withImages?.images ?? productImages;
}

function selectDisplayVariant(variants: CatalogVariant[]): CatalogVariant | undefined {
  const byPrice = (left: CatalogVariant, right: CatalogVariant) =>
    left.currentPrice - right.currentPrice;
  const availableVariants = variants.filter((variant) => variant.isAvailable);

  if (availableVariants.length > 0) {
    return (
      availableVariants.filter((variant) => variant.priceAvailable).sort(byPrice)[0] ??
      availableVariants[0]
    );
  }

  return variants.filter((variant) => variant.priceAvailable).sort(byPrice)[0] ?? variants[0];
}

function getProductStock(variants: CatalogVariant[]): number | null {
  if (variants.some((variant) => variant.isAvailable && variant.stock === null)) {
    return null;
  }

  return variants.reduce((total, variant) => total + (variant.stock ?? 0), 0);
}

export function resolveProductImages(
  product: MedusaProduct,
  placeholderImage: string,
  resolveLocalImages?: LocalProductImageResolver,
): string[] {
  const images = (product.images ?? [])
    .map((image) => image.url)
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  if (images.length > 0) return images;
  if (product.thumbnail?.trim()) return [product.thumbnail];
  const localImages = resolveLocalImages?.({ handle: product.handle, id: product.id }) ?? [];
  if (localImages.length > 0) return [...localImages];
  return [placeholderImage];
}

/** Card: a capa (thumbnail) do painel vem primeiro; a foto seguinte aparece no hover. */
function cardImages(product: MedusaProduct, images: string[]): string[] {
  const cover = product.thumbnail?.trim();
  return cover ? [cover, ...images.filter((url) => url !== cover)] : images;
}

export function mapMedusaProduct(
  product: MedusaProduct,
  placeholderImage: string,
  resolveLocalImages?: LocalProductImageResolver,
): Product {
  const variants = (product.variants ?? []).map(mapMedusaVariant);
  const displayVariant = selectDisplayVariant(variants);
  const price = displayVariant?.currentPrice ?? 0;
  const originalPrice = displayVariant?.originalPrice ?? price;
  const categoryHandle = product.categories?.[0]?.handle ?? "";
  const isAvailable = variants.some((variant) => variant.isAvailable);
  const hasSinglePurchasableVariant =
    variants.length === 1 && variants[0].isAvailable && variants[0].priceAvailable;

  return {
    id: product.id,
    name: product.title,
    slug: product.handle,
    category: categoryHandle,
    subcategory: "",
    categoryHandles: (product.categories ?? []).map((category) => category.handle),
    categoryIds: (product.categories ?? []).map((category) => category.id),
    brand: productBrand(product),
    sku: displayVariant?.sku ?? "",
    defaultVariantId: hasSinglePurchasableVariant ? variants[0].id : undefined,
    images: cardImages(product, resolveProductImages(product, placeholderImage, resolveLocalImages)),
    description: product.description ?? "",
    specs: {},
    costPrice: price,
    price1: originalPrice,
    price2: price,
    price3: price,
    currentPrice: price,
    discountPercent:
      displayVariant?.priceAvailable && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0,
    stock: getProductStock(variants),
    isAvailable,
    priceAvailable: displayVariant?.priceAvailable ?? false,
    requiresVariantSelection: variants.length > 1,
    isNew: false,
    isPromo: Boolean(displayVariant?.priceAvailable && originalPrice > price),
    rating: 0,
    reviewsCount: 0,
  };
}
