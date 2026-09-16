export type ProductImageIdentity = {
  handle?: string | null;
  id?: string | null;
};

export type ProductImageManifest = Record<string, readonly string[]>;

export type LocalProductImageResolver = (product: ProductImageIdentity) => readonly string[];

const PRODUCT_ASSET_PATH = /^\.\.\/assets\/products\/([^/]+)\/([^/]+\.(?:webp|jpe?g|png))$/i;
const RESERVED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isAllowedKey(key: string | null | undefined): key is string {
  return Boolean(key && !RESERVED_KEYS.has(key));
}

export function createProductImageManifest(assets: Record<string, string>): ProductImageManifest {
  const imagesByKey: Record<string, Array<{ filename: string; url: string }>> = Object.create(null);

  for (const [assetPath, url] of Object.entries(assets)) {
    const match = PRODUCT_ASSET_PATH.exec(assetPath);
    if (!match) continue;

    const [, key, filename] = match;
    if (!isAllowedKey(key)) continue;

    if (!Object.hasOwn(imagesByKey, key)) imagesByKey[key] = [];
    imagesByKey[key].push({ filename, url });
  }

  const manifest: Record<string, readonly string[]> = Object.create(null);
  for (const key of Object.keys(imagesByKey)) {
    manifest[key] = imagesByKey[key]
      .sort((left, right) => left.filename.localeCompare(right.filename, "en"))
      .map((image) => image.url);
  }

  return manifest;
}

export function createLocalProductImageResolver(
  manifest: ProductImageManifest,
): LocalProductImageResolver {
  const getOwnImages = (key: string | null | undefined): readonly string[] => {
    if (!isAllowedKey(key) || !Object.hasOwn(manifest, key)) return [];
    return manifest[key];
  };

  return ({ handle, id }) => {
    const handleImages = getOwnImages(handle);
    if (handleImages.length > 0) return handleImages;
    return getOwnImages(id);
  };
}
