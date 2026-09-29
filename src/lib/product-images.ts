import {
  createLocalProductImageResolver,
  createProductImageManifest,
} from "./product-image-resolver";

const productImageAssets = import.meta.glob<string>("../assets/products/*/*.{webp,jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});

const productImageManifest = createProductImageManifest(productImageAssets);

export const resolveLocalProductImages = createLocalProductImageResolver(productImageManifest);
