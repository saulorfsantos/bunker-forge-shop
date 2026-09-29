import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const repositoryRoot = new URL("..", import.meta.url);
const readSource = (path) => readFileSync(new URL(path, repositoryRoot), "utf8");

test("local Vite environment files are explicitly ignored", () => {
  const ignored = execFileSync("git", ["check-ignore", ".env", ".env.local", ".env.test.local"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.deepEqual(ignored.trim().split("\n"), [".env", ".env.local", ".env.test.local"]);
});

test("the placeholder template is tracked while .env is not tracked", () => {
  const tracked = execFileSync("git", ["ls-files", ".env", ".env.example"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  assert.deepEqual(tracked.trim().split("\n"), [".env.example"]);
});

test("the environment template contains placeholders only and no backend secret names", () => {
  const example = readSource(".env.example");
  assert.match(example, /^VITE_MERCADO_PAGO_PUBLIC_KEY=$/m);
  assert.doesNotMatch(example, /ACCESS_TOKEN|WEBHOOK_SECRET|TEST-[A-Za-z0-9_-]{8}|APP_USR-/);
});

test("checkout docs direct local public config to ignored .env.local", () => {
  const readme = readSource("README.md");
  assert.match(readme, /Copie `.env\.example` para `.env\.local`/);
  assert.match(readme, /use exclusivamente\s+`.env\.local`/);
  assert.match(readme, /nunca use `.env` como destino de configuração/);
  assert.match(readme, /injetada no bundle em build\/dev time/);
  assert.match(readme, /Access token[\s\S]*\*\*nunca\*\*[\s\S]*storefront/);
});
