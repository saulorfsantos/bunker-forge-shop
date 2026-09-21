import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  assertLoopbackBackendTarget,
  assertLoopbackHostHeader,
  assertPaymentPath,
  projectPaymentResponse,
  selectTokenizedPaymentPayload,
} from "./lib/safety.mjs";

const LOOPBACK_BIND = "127.0.0.1";
const HARNESS_PORT = parsePort(process.env.MP_HARNESS_PORT, 4310);
const PUBLIC_KEY = requirePublicKey(process.env.MERCADO_PAGO_PUBLIC_KEY);
const BACKEND_TARGET = assertLoopbackBackendTarget(process.env.MP_HARNESS_BACKEND_URL);
const PAYMENT_PATH = assertPaymentPath(process.env.MP_HARNESS_PAYMENT_PATH ?? "/payments");
const AMOUNT = parseAmount(process.env.MP_HARNESS_AMOUNT, 1);
const PUBLIC_ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const MAX_BODY_BYTES = 64 * 1024;

const STATIC_FILES = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
]);

function parsePort(rawValue, fallback) {
  const value = rawValue === undefined ? fallback : Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error("Harness port is invalid.");
  }
  return value;
}

function parseAmount(rawValue, fallback) {
  const value = rawValue === undefined ? fallback : Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Harness amount must be positive.");
  }
  return value;
}

function requirePublicKey(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("MERCADO_PAGO_PUBLIC_KEY must be provided at runtime.");
  }
  return value;
}

function setSecurityHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://sdk.mercadopago.com",
      "connect-src 'self' https://api.mercadopago.com https://*.mercadopago.com",
      "frame-src https:",
      "form-action https:",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "base-uri 'none'",
      "object-src 'none'",
    ].join("; "),
  );
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

function sendJson(response, statusCode, body) {
  setSecurityHeaders(response);
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  if (!request.headers["content-type"]?.startsWith("application/json")) {
    throw new Error("Content-Type must be application/json.");
  }

  const chunks = [];
  let byteLength = 0;

  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > MAX_BODY_BYTES) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function proxyPayment(request, response) {
  let paymentPayload;
  try {
    paymentPayload = selectTokenizedPaymentPayload(await readJsonBody(request));
  } catch {
    sendJson(response, 400, { error: "invalid_tokenized_payment_payload" });
    return;
  }

  // Revalidate immediately before every outbound request. Redirects are never followed.
  assertLoopbackBackendTarget(BACKEND_TARGET.href);
  const paymentUrl = new URL(PAYMENT_PATH, BACKEND_TARGET);

  let backendResponse;
  try {
    backendResponse = await fetch(paymentUrl, {
      method: "POST",
      redirect: "manual",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    sendJson(response, 502, { error: "local_backend_unavailable" });
    return;
  } finally {
    paymentPayload.token = "";
  }

  if (!backendResponse.ok || (backendResponse.status >= 300 && backendResponse.status < 400)) {
    sendJson(response, 502, { error: "local_backend_rejected_payment" });
    return;
  }

  try {
    const projected = projectPaymentResponse(await backendResponse.json());
    sendJson(response, 200, projected);
    if (projected.three_ds_info) {
      projected.three_ds_info.creq = "";
    }
  } catch {
    sendJson(response, 502, { error: "invalid_local_backend_response" });
  }
}

async function serveRuntimeConfig(response) {
  const config = JSON.stringify({ publicKey: PUBLIC_KEY, amount: AMOUNT }).replaceAll(
    "<",
    "\\u003c",
  );
  setSecurityHeaders(response);
  response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
  response.end(`globalThis.__MP_HARNESS_CONFIG__ = ${config};`);
}

async function serveStatic(response, fileName, contentType) {
  const filePath = path.join(PUBLIC_ROOT, fileName);
  const fileStats = await stat(filePath);
  setSecurityHeaders(response);
  response.writeHead(200, {
    "Content-Length": fileStats.size,
    "Content-Type": contentType,
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    assertLoopbackHostHeader(request.headers.host);

    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (request.method === "POST" && requestUrl.pathname === "/api/payment") {
      await proxyPayment(request, response);
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "method_not_allowed" });
      return;
    }

    if (requestUrl.pathname === "/runtime-config.js") {
      await serveRuntimeConfig(response);
      return;
    }

    const staticFile = STATIC_FILES.get(requestUrl.pathname);
    if (!staticFile) {
      sendJson(response, 404, { error: "not_found" });
      return;
    }

    await serveStatic(response, ...staticFile);
  } catch {
    if (!response.headersSent) {
      sendJson(response, 403, { error: "request_rejected" });
    } else {
      response.destroy();
    }
  }
});

server.listen(HARNESS_PORT, LOOPBACK_BIND, () => {
  process.stdout.write(
    `Mercado Pago local harness listening on http://${LOOPBACK_BIND}:${HARNESS_PORT}\n`,
  );
});
