import type { Product } from "../types/product.ts";
import { resolveProductImages } from "./catalog.ts";
import type { LocalProductImageResolver } from "./product-image-resolver.ts";

export type MedusaLineItem = {
  id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price?: number;
  title?: string;
  thumbnail?: string | null;
  product?: {
    id?: string;
    title?: string;
    handle?: string;
    thumbnail?: string | null;
  };
  variant?: {
    id?: string;
    title?: string | null;
    sku?: string | null;
  };
};

export function mapLineItemToProduct(
  lineItem: MedusaLineItem,
  placeholderImage: string,
  resolveLocalImages?: LocalProductImageResolver,
): Product {
  const productId = lineItem.product_id ?? lineItem.product?.id ?? "";
  const name = lineItem.title ?? lineItem.product?.title ?? "Produto";
  const slug = lineItem.product?.handle ?? "";
  const thumbnail = lineItem.thumbnail || lineItem.product?.thumbnail || null;
  const priceAvailable = typeof lineItem.unit_price === "number";
  const unitPrice = priceAvailable ? lineItem.unit_price! : 0;

  return {
    id: productId,
    name,
    slug,
    category: "",
    subcategory: "",
    brand: "Bunker 81",
    sku: lineItem.variant?.sku ?? "",
    images: resolveProductImages(
      { id: productId, title: name, handle: slug, thumbnail },
      placeholderImage,
      resolveLocalImages,
    ),
    description: "",
    specs: {},
    costPrice: unitPrice,
    price1: unitPrice,
    price2: unitPrice,
    price3: unitPrice,
    currentPrice: unitPrice,
    discountPercent: 0,
    stock: 0,
    isAvailable: true,
    priceAvailable,
    requiresVariantSelection: false,
    isNew: false,
    isPromo: false,
    rating: 0,
    reviewsCount: 0,
    defaultVariantId: lineItem.variant_id,
    variantTitle: lineItem.variant?.title ?? "",
  };
}
