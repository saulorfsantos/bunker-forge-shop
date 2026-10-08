import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const sdkSource = read("src/lib/medusa.ts");
const customerSource = read("src/contexts/CustomerContext.tsx");
const cartSource = read("src/contexts/CartContext.tsx");
const ordersSource = read("src/lib/customer-account.ts");
const checkoutSource = read("src/lib/checkout.ts");
const resetSource = read("src/routes/reset-password.tsx");

test("customer JWT is scoped to sessionStorage and logout rotates the browser cart", () => {
  assert.match(sdkSource, /jwtTokenStorageMethod:\s*"session"/);
  assert.match(customerSource, /await sdk\.auth\.logout\(\)/);
  assert.match(customerSource, /await startGuestCart\(\)/);
  assert.match(cartSource, /sdk\.store\.cart\.transferCart\(cartId/);
});

test("Medusa public config is available to both the browser bundle and Cloudflare SSR", () => {
  assert.match(
    sdkSource,
    /import\.meta\.env\.VITE_MEDUSA_BACKEND_URL\s*\|\|\s*runtimeEnv\?\.VITE_MEDUSA_BACKEND_URL/,
  );
  assert.match(
    sdkSource,
    /import\.meta\.env\.VITE_MEDUSA_PUBLISHABLE_KEY\s*\|\|\s*runtimeEnv\?\.VITE_MEDUSA_PUBLISHABLE_KEY/,
  );
  assert.doesNotMatch(sdkSource, /process\.env\.(?:JWT|COOKIE|SENDGRID|ADMIN|DATABASE)/);
});

test("customer order detail is derived only from the authenticated list endpoint", () => {
  assert.equal((ordersSource.match(/sdk\.store\.order\.list\(/g) ?? []).length, 2);
  assert.doesNotMatch(ordersSource, /sdk\.store\.order\.retrieve\(/);
  assert.match(checkoutSource, /sdk\.store\.order\.list\(\{ id: orderId/);
  assert.doesNotMatch(checkoutSource, /sdk\.store\.order\.retrieve\(/);
});

test("password reset uses the Medusa one-time token update route and clears auth", () => {
  assert.match(
    resetSource,
    /sdk\.auth\.updateProvider\("customer", "emailpass", \{ password \}, token\)/,
  );
  assert.match(resetSource, /await sdk\.auth\.logout\(\)/);
  assert.doesNotMatch(resetSource, /admin/i);
});

test("storefront customer code never calls an admin API", () => {
  for (const source of [customerSource, cartSource, ordersSource, checkoutSource, resetSource]) {
    assert.doesNotMatch(source, /sdk\.admin|\/admin\//);
  }
});
