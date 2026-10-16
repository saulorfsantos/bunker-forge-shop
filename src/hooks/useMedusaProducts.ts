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
  type MedusaProduct,
  type MedusaVariant,
} from "@/lib/catalog";

const PRODUCT_DETAIL_FIELDS =
  "*variants.calculated_price,id,title,handle,description,thumbnail,*images,*categories,metadata,*variants,+variants.inventory_quantity,*options";

type MedusaProductDetail = MedusaProduct & {
  options?: Array<{
    id: string;
    title: string;
    values?: Array<{ id: string; value: string }>;
  }>;
  variants?: MedusaVariant[];
};

export type ProductVariantDetail = {
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

export type ProductOptionDetail = {
  id: string;
  title: string;
  values: string[];
};

export type ProductDetail = Product & {
  variants: ProductVariantDetail[];
  options: ProductOptionDetail[];
};

export function mapMedusaProductDetail(product: MedusaProductDetail): ProductDetail {
  const base = mapMedusaProduct(product, placeholderImage, resolveLocalProductImages);

  return {
    ...base,
    images: resolveProductImages(product, placeholderImage, resolveLocalProductImages),
    variants: (product.variants ?? []).map(mapMedusaVariant),
    options: (product.options ?? []).map((option) => ({
      id: option.id,
      title: option.title,
      values: (option.values ?? []).map((value) => value.value),
    })),
  };
}

async function fetchProducts(options: { limit?: number; categoryIds?: string[] }) {
  const { products } = await sdk.store.product.list({
    limit: options.limit ?? 8,
    region_id: BRAZIL_REGION_ID,
    fields: PRODUCT_LIST_FIELDS,
    ...(options.categoryIds?.length ? { category_id: options.categoryIds } : {}),
  });

  return (products as MedusaProduct[]).map((product) =>
    mapMedusaProduct(product, placeholderImage, resolveLocalProductImages),
  );
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
