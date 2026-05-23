import { useQuery } from "@tanstack/react-query";
import {
  BRAZIL_REGION_ID,
  PRODUCT_LIST_FIELDS,
  sdk,
} from "@/lib/medusa";
import type { Category, Product } from "@/types/product";
import placeholderImage from "@/assets/logo-shield.png";

type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string | null;
  description?: string | null;
  categories?: Array<{ id: string; handle: string; name: string }>;
  variants?: Array<{
    sku?: string | null;
    calculated_price?: {
      calculated_amount?: number;
      original_amount?: number;
    };
  }>;
};

type MedusaCategory = {
  id: string;
  name: string;
  handle: string;
};

const CATEGORY_ICON_BY_HANDLE: Record<string, Category["icon"]> = {
  airsoft: "Crosshair",
  pressao: "Target",
  acessorios: "Shield",
  cutelaria: "Swords",
};

export function mapMedusaProduct(product: MedusaProduct): Product {
  const variant = product.variants?.[0];
  const price = variant?.calculated_price?.calculated_amount ?? 0;
  const originalPrice = variant?.calculated_price?.original_amount ?? price;
  const categoryHandle = product.categories?.[0]?.handle ?? "";

  return {
    id: product.id,
    name: product.title,
    slug: product.handle,
    category: categoryHandle,
    subcategory: "",
    brand: "Bunker 81",
    sku: variant?.sku ?? "",
    images: product.thumbnail ? [product.thumbnail] : [placeholderImage],
    description: product.description ?? "",
    specs: {},
    costPrice: price,
    price1: originalPrice,
    price2: price,
    price3: price,
    currentPrice: price,
    discountPercent:
      originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0,
    stock: 0,
    isNew: false,
    isPromo: originalPrice > price,
    rating: 0,
    reviewsCount: 0,
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

  return (products as MedusaProduct[]).map(mapMedusaProduct);
}

export const medusaQueryKeys = {
  products: (limit?: number) => ["medusa", "products", { limit }] as const,
  productsByCategory: (categoryId: string, limit?: number) =>
    ["medusa", "products", "category", categoryId, { limit }] as const,
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
