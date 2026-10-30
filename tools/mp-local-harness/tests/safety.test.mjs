import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertLoopbackBackendTarget,
  assertLoopbackHostHeader,
  projectPaymentResponse,
  selectTokenizedPaymentPayload,
} from "../lib/safety.mjs";

test("accepts only explicit loopback backend origins", () => {
  for (const target of [
    "http://localhost:4311/",
    "http://127.0.0.1:4311/",
    "http://127.42.0.9:4311/",
    "https://[::1]:4311/",
  ]) {
    assert.doesNotThrow(() => assertLoopbackBackendTarget(target));
  }

  for (const target of [
    undefined,
    "",
    "https://example.com/",
    "http://192.168.0.10:4311/",
    "http://backend.local:4311/",
    "ftp://127.0.0.1/",
    "http://127.0.0.1:4311/api",
  ]) {
    assert.throws(() => assertLoopbackBackendTarget(target));
  }
});

test("rejects DNS rebinding-style Host headers", () => {
  assert.doesNotThrow(() => assertLoopbackHostHeader("localhost:4310"));
  assert.doesNotThrow(() => assertLoopbackHostHeader("127.0.0.1:4310"));
  assert.throws(() => assertLoopbackHostHeader("example.com"));
  assert.throws(() => assertLoopbackHostHeader("missing-dot-local.test"));
});

test("forwards a strict tokenized allowlist and rejects raw card fields", () => {
  const token = randomBytes(24).toString("base64url");
  assert.deepEqual(
    selectTokenizedPaymentPayload({
      token,
      transaction_amount: 1,
      payment_method_id: "visa",
      ignored: "not-forwarded",
    }),
    { token, transaction_amount: 1, payment_method_id: "visa" },
  );

  for (const forbiddenKey of ["cardNumber", "securityCode", "cvv", "pan"]) {
    assert.throws(() =>
      selectTokenizedPaymentPayload({
        token,
        transaction_amount: 1,
        nested: { [forbiddenKey]: "forbidden" },
      }),
    );
  }
});

test("accepts 3DS continuation only with HTTPS URL and ephemeral challenge data", () => {
  const challengeRequest = randomBytes(96).toString("base64url");
  const projected = projectPaymentResponse({
    status: "pending",
    three_ds_info: {
      external_resource_url: "https://challenge.example.test/session",
      creq: challengeRequest,
    },
  });
  assert.equal(projected.three_ds_info.creq, challengeRequest);
  assert.throws(() =>
    projectPaymentResponse({
      status: "pending",
      three_ds_info: {
        external_resource_url: "http://challenge.example.test/session",
        creq: challengeRequest,
      },
    }),
  );
});

test("runtime sources do not write sensitive payloads to logs or storage", async () => {
  const sources = await Promise.all(
    ["../server.mjs", "../mock-backend.mjs", "../public/app.js"].map((relativePath) =>
      readFile(new URL(relativePath, import.meta.url), "utf8"),
    ),
  );
  const joined = sources.join("\n");
  assert.doesNotMatch(joined, /console\.(?:log|info|warn|error|debug)/);
  assert.doesNotMatch(joined, /localStorage|sessionStorage|indexedDB/);
  assert.doesNotMatch(joined, /writeFile|appendFile/);
});
