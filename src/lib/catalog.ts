import type { Product } from "../types/product.ts";

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
};

export type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string | null;
  description?: string | null;
  images?: Array<{ url?: string | null }>;
  categories?: Array<{ id: string; handle: string; name: string }>;
  variants?: MedusaVariant[];
};

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
};

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

export function resolveProductImages(product: MedusaProduct, placeholderImage: string): string[] {
  const images = (product.images ?? [])
    .map((image) => image.url)
    .filter((url): url is string => Boolean(url));

  if (images.length > 0) return images;
  if (product.thumbnail) return [product.thumbnail];
  return [placeholderImage];
}

export function mapMedusaProduct(product: MedusaProduct, placeholderImage: string): Product {
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
    brand: "Bunker 81",
    sku: displayVariant?.sku ?? "",
    defaultVariantId: hasSinglePurchasableVariant ? variants[0].id : undefined,
    images: resolveProductImages(product, placeholderImage),
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
