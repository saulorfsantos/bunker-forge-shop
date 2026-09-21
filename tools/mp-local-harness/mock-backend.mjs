import http from "node:http";
import { selectTokenizedPaymentPayload } from "./lib/safety.mjs";

const LOOPBACK_BIND = "127.0.0.1";
const PORT = parsePort(process.env.MP_HARNESS_MOCK_PORT, 4311);
const MAX_BODY_BYTES = 64 * 1024;

function parsePort(rawValue, fallback) {
  const value = rawValue === undefined ? fallback : Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error("Mock port is invalid.");
  }
  return value;
}

async function readJsonBody(request) {
  const chunks = [];
  let byteLength = 0;
  for await (const chunk of request) {
    byteLength += chunk.length;
    if (byteLength > MAX_BODY_BYTES) {
      throw new Error("Request body too large.");
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = http.createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/payments") {
    response.writeHead(404).end();
    return;
  }

  try {
    const payment = selectTokenizedPaymentPayload(await readJsonBody(request));
    payment.token = "";
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ status: "approved", status_detail: "local_mock_only" }));
  } catch {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "invalid_request" }));
  }
});

server.listen(PORT, LOOPBACK_BIND, () => {
  process.stdout.write(`Local payment mock listening on http://${LOOPBACK_BIND}:${PORT}\n`);
});
