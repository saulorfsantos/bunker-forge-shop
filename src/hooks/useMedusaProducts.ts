import { useQuery } from "@tanstack/react-query";
import { BRAZIL_REGION_ID, PRODUCT_LIST_FIELDS, sdk } from "@/lib/medusa";
import type { Category, Product } from "@/types/product";
import placeholderImage from "@/assets/logo-shield.png";
import { resolveLocalProductImages } from "@/lib/product-images";
import {
  mapMedusaProduct,
  mapMedusaVariant,
  resolveProductImages,
  type MedusaProduct,
  type MedusaVariant,
} from "@/lib/catalog";

type MedusaCategory = {
  id: string;
  name: string;
  handle: string;
};

const PRODUCT_DETAIL_FIELDS =
  "*variants.calculated_price,id,title,handle,description,thumbnail,*images,*categories,*variants,+variants.inventory_quantity,*options";

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

const CATEGORY_ICON_BY_HANDLE: Record<string, Category["icon"]> = {
  airsoft: "Crosshair",
  pressao: "Target",
  acessorios: "Shield",
  cutelaria: "Swords",
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

function mapMedusaCategory(category: MedusaCategory): Category {
  return {
    slug: category.handle,
    name: category.name,
    icon: CATEGORY_ICON_BY_HANDLE[category.handle] ?? "Crosshair",
    subcategories: [],
  };
}

async function fetchProducts(options: { limit?: number; categoryId?: string }) {
  const { products } = await sdk.store.product.list({
    limit: options.limit ?? 8,
    region_id: BRAZIL_REGION_ID,
    fields: PRODUCT_LIST_FIELDS,
    ...(options.categoryId ? { category_id: [options.categoryId] } : {}),
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
  productsByCategory: (categoryId: string, limit?: number) =>
    ["medusa", "products", "category", categoryId, { limit }] as const,
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

export function useProductsByCategory(categoryId: string, limit = 8) {
  return useQuery({
    queryKey: medusaQueryKeys.productsByCategory(categoryId, limit),
    queryFn: () => fetchProducts({ limit, categoryId }),
    enabled: Boolean(categoryId),
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

export function useCategories() {
  return useQuery({
    queryKey: medusaQueryKeys.categories(),
    queryFn: async () => {
      const { product_categories } = await sdk.store.category.list({
        limit: 50,
        fields: "id,name,handle",
      });

      return (product_categories as MedusaCategory[])
        .map(mapMedusaCategory)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    },
  });
}
