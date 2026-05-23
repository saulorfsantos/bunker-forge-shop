import Medusa from "@medusajs/js-sdk";

const baseUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL;
const publishableKey = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY;

if (!baseUrl) {
  throw new Error("VITE_MEDUSA_BACKEND_URL is not defined");
}

if (!publishableKey) {
  throw new Error("VITE_MEDUSA_PUBLISHABLE_KEY is not defined");
}

export const sdk = new Medusa({
  baseUrl,
  publishableKey,
});

/** Região Brasil (BRL) — necessária para calculated_price nos produtos. */
export const BRAZIL_REGION_ID = "reg_01KS62SJ6RCSCZFKJYZ12FN96Y";

export const MEDUSA_CATEGORY_IDS = {
  AIRSOFT: "pcat_01KS4XNZC8VHRNTH47Z8EBA45R",
  ACESSORIOS: "pcat_01KS4XNZC8KQFD0DQQHG48YGTB",
  PRESSAO: "pcat_01KS4XNZC82BKQYV0XD2K7MM59",
  CUTELARIA: "pcat_01KS4XNZC7QE2V16G7AYK0TB9G",
} as const;

export const PRODUCT_LIST_FIELDS =
  "id,title,handle,thumbnail,description,*variants,*variants.calculated_price,*categories";
