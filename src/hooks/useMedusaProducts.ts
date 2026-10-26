import { useQuery } from "@tanstack/react-query";
import { BRAZIL_REGION_ID, PRODUCT_LIST_FIELDS, sdk } from "@/lib/medusa";
import type { Product } from "@/types/product";
import placeholderImage from "@/assets/logo-shield.png";
import { resolveLocalProductImages } from "@/lib/product-images";
import {
  mapMedusaCategory,
  sortCategoryNodes,
  type MedusaCategoryNode,
} from "@/lib/category-hierarchy";
import {
  mapMedusaProduct,
  mapMedusaVariant,
  resolveProductImages,
  type CatalogOption,
  type CatalogVariant,
  type MedusaProduct,
  type MedusaVariant,
} from "@/lib/catalog";

const PRODUCT_DETAIL_FIELDS =
  "*variants.calculated_price,id,title,handle,description,thumbnail,*images,*categories,metadata,*variants,+variants.inventory_quantity,*options,*options.values,*variants.options,*variants.images";

type MedusaProductDetail = MedusaProduct & {
  options?: Array<{
    id: string;
    title: string;
    values?: Array<{ id: string; value: string; rank?: number | null }>;
  }>;
  variants?: MedusaVariant[];
};

export type ProductVariantDetail = CatalogVariant;

export type ProductOptionDetail = CatalogOption;

export type ProductDetail = Product & {
  variants: ProductVariantDetail[];
  options: ProductOptionDetail[];
};

function byRank(left?: number | null, right?: number | null): number {
  return (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER);
}

export function mapMedusaProductDetail(product: MedusaProductDetail): ProductDetail {
  const base = mapMedusaProduct(product, placeholderImage, resolveLocalProductImages);

  return {
    ...base,
    images: resolveProductImages(product, placeholderImage, resolveLocalProductImages),
    // Admin order: variants by variant_rank, option values by rank (unranked last).
    variants: [...(product.variants ?? [])]
      .sort((left, right) => byRank(left.variant_rank, right.variant_rank))
      .map(mapMedusaVariant),
    options: (product.options ?? []).map((option) => ({
      id: option.id,
      title: option.title,
      values: [...(option.values ?? [])]
        .sort((left, right) => byRank(left.rank, right.rank))
        .map((value) => value.value)
        .filter((value): value is string => typeof value === "string"),
    })),
  };
}

async function fetchProducts(options: {
  limit?: number;
  categoryIds?: string[];
  collectionIds?: string[];
}) {
  const { products } = await sdk.store.product.list({
    limit: options.limit ?? 8,
    region_id: BRAZIL_REGION_ID,
    fields: PRODUCT_LIST_FIELDS,
    ...(options.categoryIds?.length ? { category_id: options.categoryIds } : {}),
    ...(options.collectionIds?.length ? { collection_id: options.collectionIds } : {}),
  });

  return (products as MedusaProduct[]).map((product) =>
    mapMedusaProduct(product, placeholderImage, resolveLocalProductImages),
  );
}

/**
 * Products of the first collection whose handle starts with `handlePrefix`; empty when there is
 * none, so callers can fall back to another list. A prefix because the panel derives the handle
 * from the title ("Destaques " became "destaques-").
 */
async function fetchCollectionProducts(handlePrefix: string, limit: number) {
  const { collections } = await sdk.store.collection.list({ limit: 100, fields: "id,handle" });
  const collectionId = collections.find((c: { handle?: string | null }) =>
    c.handle?.startsWith(handlePrefix),
  )?.id;
  return collectionId ? fetchProducts({ limit, collectionIds: [collectionId] }) : [];
}

async function fetchSearchProducts(query: string, limit = 50) {
  const { products } = await sdk.store.product.list({
    q: query,
    limit,
    region_id: BRAZIL_REGION_ID,
    fields: PRODUCT_LIST_FIELDS,
  });

  return (products as MedusaProduct[]).map((product) =>
    mapMedusaProduct(product, placeholderImage, resolveLocalProductImages),
  );
}

async function fetchProduct(id: string) {
  const { product } = await sdk.store.product.retrieve(id, {
    region_id: BRAZIL_REGION_ID,
    fields: PRODUCT_DETAIL_FIELDS,
  });

  return mapMedusaProductDetail(product as MedusaProductDetail);
}

export const medusaQueryKeys = {
  products: (limit?: number) => ["medusa", "products", { limit }] as const,
  productsByCategory: (categoryIds: string[], limit?: number) =>
    ["medusa", "products", "category", categoryIds, { limit }] as const,
  productsByCollection: (handle: string, limit?: number) =>
    ["medusa", "products", "collection", handle, { limit }] as const,
  product: (id: string) => ["medusa", "products", "detail", id] as const,
  search: (q: string) => ["medusa", "products", "search", q] as const,
  categories: () => ["medusa", "categories"] as const,
};

export function useProducts(limit = 8) {
  return useQuery({
    queryKey: medusaQueryKeys.products(limit),
    queryFn: () => fetchProducts({ limit }),
  });
}

/** Pass the category and its descendants so a parent tab lists every sub-item's products. */
export function useProductsByCategory(categoryIds: string[], limit = 8) {
  return useQuery({
    queryKey: medusaQueryKeys.productsByCategory(categoryIds, limit),
    queryFn: () => fetchProducts({ limit, categoryIds }),
    enabled: categoryIds.length > 0,
  });
}

export function useProductsByCollection(handle: string, limit = 8) {
  return useQuery({
    queryKey: medusaQueryKeys.productsByCollection(handle, limit),
    queryFn: () => fetchCollectionProducts(handle, limit),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: medusaQueryKeys.product(id),
    queryFn: () => fetchProduct(id),
    enabled: Boolean(id),
  });
}

export function useSearchProducts(q: string, limit = 50) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: medusaQueryKeys.search(trimmed),
    queryFn: () => fetchSearchProducts(trimmed, limit),
    enabled: Boolean(trimmed),
  });
}

async function fetchCategoryTree() {
  const { product_categories } = await sdk.store.category.list({
    limit: 100,
    parent_category_id: null,
    include_descendants_tree: true,
    fields: "id,name,handle,rank,parent_category_id,*category_children",
  });

  // The JS SDK drops `parent_category_id: null` from the query string, so Medusa returns
  // every category; keep only the top level here. Menu order follows the Medusa rank.
  return sortCategoryNodes(
    (product_categories as MedusaCategoryNode[]).filter((category) => !category.parent_category_id),
  );
}

/** Raw category tree (with ids), shared with useCategories through the same cache entry. */
export function useCategoryTree() {
  return useQuery({
    queryKey: medusaQueryKeys.categories(),
    queryFn: fetchCategoryTree,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: medusaQueryKeys.categories(),
    queryFn: fetchCategoryTree,
    select: (nodes) => nodes.map(mapMedusaCategory),
  });
}
