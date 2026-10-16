import Medusa from "@medusajs/js-sdk";

// Vite injects public values into the browser bundle, while Cloudflare exposes
// Wrangler bindings through process.env in the SSR Worker runtime.
const runtimeEnv = typeof process !== "undefined" ? process.env : undefined;

export const MEDUSA_BACKEND_URL =
  import.meta.env.VITE_MEDUSA_BACKEND_URL || runtimeEnv?.VITE_MEDUSA_BACKEND_URL;
export const MEDUSA_PUBLISHABLE_KEY =
  import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || runtimeEnv?.VITE_MEDUSA_PUBLISHABLE_KEY;

if (!MEDUSA_BACKEND_URL) {
  throw new Error("VITE_MEDUSA_BACKEND_URL is not defined");
}

if (!MEDUSA_PUBLISHABLE_KEY) {
  throw new Error("VITE_MEDUSA_PUBLISHABLE_KEY is not defined");
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: "session",
    jwtTokenStorageKey: "bunker81-customer-token",
  },
});

/** Região Brasil (BRL) — necessária para calculated_price nos produtos. */
export const BRAZIL_REGION_ID = "reg_01KS62SJ6RCSCZFKJYZ12FN96Y";

export const PRODUCT_LIST_FIELDS =
  "*variants.calculated_price,id,title,handle,thumbnail,description,*variants,+variants.inventory_quantity,*categories,metadata";

/** localStorage key for the Medusa cart id (separate from mock cart items). */
export const MEDUSA_CART_ID_KEY = "bunker81-medusa-cart-id";
