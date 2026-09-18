import type { Category } from "../types/product";

export type MedusaCategoryNode = {
  id: string;
  name: string;
  handle: string;
  category_children?: MedusaCategoryNode[];
};

const CATEGORY_ICON_BY_HANDLE: Record<string, Category["icon"]> = {
  airsoft: "Crosshair",
  pressao: "Target",
  acessorios: "Shield",
  cutelaria: "Swords",
};

export function mapMedusaCategory(category: MedusaCategoryNode): Category {
  return {
    slug: category.handle,
    name: category.name,
    icon: CATEGORY_ICON_BY_HANDLE[category.handle] ?? "Crosshair",
    subcategories: (category.category_children ?? []).map((child) => ({
      slug: child.handle,
      name: child.name,
    })),
  };
}
