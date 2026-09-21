import net from "node:net";

const FORBIDDEN_PAYMENT_KEYS = new Set([
  "cardnumber",
  "card_number",
  "cvv",
  "pan",
  "securitycode",
  "security_code",
]);

function normalizedHostname(hostname) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

export function isLoopbackHostname(hostname) {
  const normalized = normalizedHostname(hostname);

  if (normalized === "localhost" || normalized === "::1") {
    return true;
  }

  if (net.isIP(normalized) !== 4) {
    return false;
  }

  return normalized.split(".")[0] === "127";
}

export function assertLoopbackBackendTarget(rawTarget) {
  if (typeof rawTarget !== "string" || rawTarget.trim() === "") {
    throw new Error("Backend target is UNKNOWN; set MP_HARNESS_BACKEND_URL explicitly.");
  }

  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    throw new Error("Backend target is invalid; refusing to start.");
  }

  if (!new Set(["http:", "https:"]).has(target.protocol)) {
    throw new Error("Backend target must use HTTP(S) on loopback.");
  }

  if (!isLoopbackHostname(target.hostname)) {
    throw new Error("Backend target is remote; refusing to start.");
  }

  if (target.username || target.password || target.search || target.hash) {
    throw new Error("Backend target must not contain credentials, query, or fragment.");
  }

  if (target.pathname !== "/") {
    throw new Error("Backend target must be an origin; configure the payment path separately.");
  }

  return target;
}

export function assertLoopbackHostHeader(rawHost) {
  if (typeof rawHost !== "string" || rawHost.trim() === "") {
    throw new Error("Missing Host header.");
  }

  let requestUrl;
  try {
    requestUrl = new URL(`http://${rawHost}`);
  } catch {
    throw new Error("Invalid Host header.");
  }

  if (!isLoopbackHostname(requestUrl.hostname)) {
    throw new Error("Non-loopback Host header rejected.");
  }
}

export function assertPaymentPath(rawPath) {
  if (typeof rawPath !== "string" || !/^\/[a-zA-Z0-9/_-]*$/.test(rawPath)) {
    throw new Error("Payment path must be a simple absolute path.");
  }

  return rawPath;
}

function assertNoCardData(value) {
  if (Array.isArray(value)) {
    value.forEach(assertNoCardData);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (FORBIDDEN_PAYMENT_KEYS.has(key.toLowerCase())) {
      throw new Error("Raw card data is forbidden.");
    }
    assertNoCardData(nestedValue);
  }
}

export function selectTokenizedPaymentPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Payment payload must be an object.");
  }

  assertNoCardData(value);

  if (typeof value.token !== "string" || value.token.length < 1) {
    throw new Error("A browser-generated payment token is required.");
  }

  const amount = Number(value.transaction_amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("A positive transaction amount is required.");
  }

  const payload = {
    token: value.token,
    transaction_amount: amount,
  };

  for (const key of ["issuer_id", "payment_method_id", "installments", "payer"]) {
    if (value[key] !== undefined) {
      payload[key] = value[key];
    }
  }

  return payload;
}

export function projectPaymentResponse(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Local backend returned an invalid response.");
  }

  const result = {
    status: typeof value.status === "string" ? value.status : "unknown",
    status_detail: typeof value.status_detail === "string" ? value.status_detail : undefined,
  };

  if (value.three_ds_info !== undefined) {
    const info = value.three_ds_info;
    if (!info || typeof info !== "object" || Array.isArray(info)) {
      throw new Error("Local backend returned invalid 3DS data.");
    }

    let challengeUrl;
    try {
      challengeUrl = new URL(info.external_resource_url);
    } catch {
      throw new Error("3DS external resource URL is invalid.");
    }

    if (challengeUrl.protocol !== "https:") {
      throw new Error("3DS external resource URL must use HTTPS.");
    }

    if (typeof info.creq !== "string" || info.creq.length < 1) {
      throw new Error("3DS challenge request is missing.");
    }

    result.three_ds_info = {
      external_resource_url: challengeUrl.href,
      creq: info.creq,
    };
  }

  return result;
}
