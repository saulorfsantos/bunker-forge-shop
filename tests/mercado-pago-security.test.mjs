import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const contractSource = readSource("../src/lib/payments/mercado-pago-contract.ts");
const apiSource = readSource("../src/lib/payments/mercado-pago-api.ts");
const browserSource = readSource("../src/lib/payments/mercado-pago-browser.ts");
const componentSource = readSource("../src/components/checkout/MercadoPagoCheckout.tsx");
const checkoutSource = readSource("../src/routes/checkout.tsx");
const environmentExample = readSource("../.env.example");

test("production checkout never imports the dev-only harness or an admin endpoint", () => {
  for (const source of [
    contractSource,
    apiSource,
    browserSource,
    componentSource,
    checkoutSource,
  ]) {
    assert.doesNotMatch(source, /tools\/mercado-pago-sandbox-harness|server\.mjs|safety\.mjs/);
    assert.doesNotMatch(source, /\/admin(?:\/|\b)/);
  }
});

test("storefront configuration contains no access token or committed Mercado Pago value", () => {
  assert.match(environmentExample, /^VITE_MERCADO_PAGO_PUBLIC_KEY=$/m);
  assert.doesNotMatch(environmentExample, /ACCESS_TOKEN|WEBHOOK_SECRET|TEST-[A-Za-z0-9_-]{8}/);
  for (const source of [contractSource, apiSource, browserSource, componentSource]) {
    assert.doesNotMatch(source, /MERCADO_PAGO_ACCESS_TOKEN|VITE_[A-Z_]*ACCESS_TOKEN/);
  }
});

test("Medusa card payload is constructed from an explicit allowlist", () => {
  assert.match(contractSource, /interface CardSessionData/);
  assert.match(contractSource, /token: requiredString\(formData\.token/);
  assert.match(contractSource, /payment_method_id: requiredString\(formData\.payment_method_id/);
  assert.doesNotMatch(contractSource, /formData\.(?:card_number|security_code|cvv|three_ds_info)/);
  assert.doesNotMatch(apiSource, /console\.(?:log|debug|info|warn|error)/);
});

test("all required checkout UI states and double-submit locks are explicit", () => {
  for (const state of [
    "idle",
    "loading",
    "ready",
    "pending",
    "challenge",
    "success",
    "recoverable-error",
    "fatal-error",
  ]) {
    assert.match(componentSource, new RegExp(`"${state}"`));
  }
  assert.match(componentSource, /submissionLock\.current\.tryAcquire\(\)/);
  assert.match(componentSource, /completionLock\.current\.tryAcquire\(\)/);
});

test("3DS iframe cannot declare success and backend polling owns final status", () => {
  assert.match(componentSource, /sandbox="allow-forms allow-scripts allow-same-origin"/);
  assert.match(componentSource, /startPolling\(MERCADO_PAGO_CARD_PROVIDER_ID/);
  assert.match(componentSource, /completeApprovedPayment/);
  assert.doesNotMatch(componentSource, /postMessage|addEventListener\(["']message/);
  assert.doesNotMatch(componentSource, /onLoad=.*completeApprovedPayment/);
  assert.doesNotMatch(componentSource, />\s*\{challenge\.creq\}\s*</);
});

test("Pix copy feedback never logs the copied payment payload", () => {
  assert.match(componentSource, /navigator\.clipboard\.writeText\(pix\.qrCode\)/);
  assert.match(componentSource, /Código copiado/);
  assert.doesNotMatch(componentSource, /console\.(?:log|debug|info)\(pix/);
});
