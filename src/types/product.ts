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
  stock: number;
  isNew: boolean;
  isPromo: boolean;
  rating: number;
  reviewsCount: number;
  /** First variant id from Medusa — used by cart to skip an extra product retrieve. */
  defaultVariantId?: string;
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
  productId: string;
  quantity: number;
}
