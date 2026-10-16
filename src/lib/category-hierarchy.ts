import type { Category } from "../types/product";

export type MedusaCategoryNode = {
  id: string;
  name: string;
  handle: string;
  rank?: number | null;
  category_children?: MedusaCategoryNode[];
};

const CATEGORY_ICON_BY_HANDLE: Record<string, Category["icon"]> = {
  "armas-airsoft": "Crosshair",
  "airguns-carabinas": "Target",
  suprimentos: "Package",
  pecas: "Wrench",
  loadout: "Shield",
  acessorios: "ScanEye",
  magazines: "Layers",
  // Handles from the previous menu, kept while the catalogue migrates.
  airsoft: "Crosshair",
  pressao: "Target",
  cutelaria: "Swords",
};

/** Old menu handles that now live under a new handle; their links must keep working. */
export const LEGACY_CATEGORY_HANDLES: Record<string, string> = {
  airsoft: "armas-airsoft",
  pressao: "airguns-carabinas",
};

function byRank(a: MedusaCategoryNode, b: MedusaCategoryNode): number {
  const rankA = typeof a.rank === "number" ? a.rank : Number.MAX_SAFE_INTEGER;
  const rankB = typeof b.rank === "number" ? b.rank : Number.MAX_SAFE_INTEGER;
  return rankA - rankB || a.name.localeCompare(b.name, "pt-BR");
}

/** Orders every level by the rank set in Medusa (menu order), falling back to the name. */
export function sortCategoryNodes(nodes: MedusaCategoryNode[]): MedusaCategoryNode[] {
  return [...nodes].sort(byRank).map((node) => ({
    ...node,
    category_children: sortCategoryNodes(node.category_children ?? []),
  }));
}

/** The category itself plus every descendant, so a parent page lists its sub-items' products. */
export function collectCategoryIds(node: MedusaCategoryNode): string[] {
  return [node.id, ...(node.category_children ?? []).flatMap(collectCategoryIds)];
}

/** Ids of the categories with these handles (at any level) and of all their descendants. */
export function categoryIdsByHandle(nodes: MedusaCategoryNode[], handles: string[]): string[] {
  const ids = new Set<string>();
  const visit = (node: MedusaCategoryNode) => {
    if (handles.includes(node.handle)) collectCategoryIds(node).forEach((id) => ids.add(id));
    else (node.category_children ?? []).forEach(visit);
  };
  nodes.forEach(visit);
  return [...ids];
}

export function mapMedusaCategory(category: MedusaCategoryNode): Category {
  return {
    slug: category.handle,
    name: category.name,
    icon: CATEGORY_ICON_BY_HANDLE[category.handle] ?? "Crosshair",
    subcategories: [...(category.category_children ?? [])].sort(byRank).map((child) => ({
      slug: child.handle,
      name: child.name,
    })),
  };
}
