export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  brand: string;
  sku: string;
  images: string[];
  description: string;
  specs: Record<string, string>;
  costPrice: number;
  price1: number;
  price2: number;
  price3: number;
  currentPrice: number;
  discountPercent: number;
  stock: number | null;
  isAvailable: boolean;
  priceAvailable: boolean;
  requiresVariantSelection: boolean;
  isNew: boolean;
  isPromo: boolean;
  rating: number;
  reviewsCount: number;
  /** Set only when the product has exactly one purchasable variant. */
  defaultVariantId?: string;
  variantTitle?: string;
}

export interface Subcategory {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
}
