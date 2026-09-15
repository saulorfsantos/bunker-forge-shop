export const MERCADO_PAGO_PIX_PROVIDER_ID = "pp_mercadopago-pix_mercadopago";
export const MERCADO_PAGO_CARD_PROVIDER_ID = "pp_mercadopago-card_mercadopago";

export const MERCADO_PAGO_PROVIDER_IDS = [
  MERCADO_PAGO_PIX_PROVIDER_ID,
  MERCADO_PAGO_CARD_PROVIDER_ID,
] as const;

export type MercadoPagoProviderId = (typeof MERCADO_PAGO_PROVIDER_IDS)[number];
export type MercadoPagoMethod = "pix" | "card";

export interface MercadoPagoPaymentSession {
  id?: string;
  provider_id: string;
  status?: string;
  data?: Record<string, unknown> | null;
}

export interface MercadoPagoPaymentCollection {
  id: string;
  payment_sessions?: MercadoPagoPaymentSession[];
}

export interface MercadoPagoCart {
  id: string;
  email?: string;
  total?: number;
  currency_code?: string;
  payment_collection?: MercadoPagoPaymentCollection | null;
}

export interface CardSessionData {
  token: string;
  payment_method_id: string;
  installments: number;
  issuer_id?: string | number;
  payer_email?: string;
}

export interface PixSessionData {
  payer_email: string;
  payer_identification: {
    type: "CPF";
    number: string;
  };
}

export interface ThreeDSChallenge {
  externalResourceUrl: string;
  hostname: string;
  creq: string;
}

export interface PixPresentation {
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expiresAt?: string;
}

export type PaymentSessionState =
  | { terminal: false; outcome: "pending"; status: string }
  | { terminal: false; outcome: "challenge"; status: string; challenge: ThreeDSChallenge }
  | { terminal: true; outcome: "succeeded"; status: string }
  | { terminal: true; outcome: "failed"; status: string };

export class PaymentContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentContractError";
  }
}

export class PaymentPollingTimeoutError extends Error {
  constructor(message = "O backend não confirmou o pagamento dentro do tempo limite.") {
    super(message);
    this.name = "PaymentPollingTimeoutError";
  }
}

export class PaymentPollingAbortedError extends Error {
  constructor() {
    super("A consulta do pagamento foi cancelada.");
    this.name = "PaymentPollingAbortedError";
  }
}

const SUCCESS_STATUSES = new Set(["authorized", "approved", "captured"]);
const FAILURE_STATUSES = new Set([
  "error",
  "canceled",
  "cancelled",
  "charged_back",
  "expired",
  "refunded",
  "rejected",
]);
const PRIVATE_HOST_SUFFIXES = [".internal", ".lan", ".local", ".localhost", ".home"];

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PaymentContractError("O backend retornou dados de pagamento inválidos.");
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown, label: string): string {
  const normalized = optionalString(value);
  if (!normalized) throw new PaymentContractError(`${label} está ausente.`);
  return normalized;
}

function requiredPositiveAmount(value: unknown, label: string): number {
  const amount = typeof value === "string" ? Number(value) : value;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new PaymentContractError(`${label} está inválido.`);
  }
  return amount;
}

function requiredInstallments(value: unknown): number {
  const installments = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(installments) || Number(installments) <= 0) {
    throw new PaymentContractError("A quantidade de parcelas retornada pelo cartão está inválida.");
  }
  return Number(installments);
}

export function methodToProviderId(method: MercadoPagoMethod): MercadoPagoProviderId {
  return method === "pix" ? MERCADO_PAGO_PIX_PROVIDER_ID : MERCADO_PAGO_CARD_PROVIDER_ID;
}

export function providerIdToMethod(providerId: string): MercadoPagoMethod | null {
  if (providerId === MERCADO_PAGO_PIX_PROVIDER_ID) return "pix";
  if (providerId === MERCADO_PAGO_CARD_PROVIDER_ID) return "card";
  return null;
}

export function isMercadoPagoProviderId(providerId: string): providerId is MercadoPagoProviderId {
  return providerIdToMethod(providerId) !== null;
}

export function buildCardSessionData(
  formDataValue: unknown,
  expectedAmount: number,
): CardSessionData {
  const formData = asRecord(formDataValue);
  const submittedAmount = requiredPositiveAmount(
    formData.transaction_amount,
    "O valor retornado pelo cartão",
  );
  const authoritativeAmount = requiredPositiveAmount(expectedAmount, "O total do carrinho");
  if (Math.abs(submittedAmount - authoritativeAmount) > 0.001) {
    throw new PaymentContractError("O valor retornado pelo cartão diverge do total do carrinho.");
  }

  const payer =
    formData.payer && typeof formData.payer === "object" && !Array.isArray(formData.payer)
      ? (formData.payer as Record<string, unknown>)
      : {};
  const data: CardSessionData = {
    token: requiredString(formData.token, "O token do cartão"),
    payment_method_id: requiredString(formData.payment_method_id, "O método do cartão"),
    installments: requiredInstallments(formData.installments),
  };

  const issuerId = formData.issuer_id;
  if (
    (typeof issuerId === "string" && issuerId.trim()) ||
    (typeof issuerId === "number" && Number.isSafeInteger(issuerId) && issuerId > 0)
  ) {
    data.issuer_id = typeof issuerId === "string" ? issuerId.trim() : issuerId;
  }

  const payerEmail = optionalString(payer.email);
  if (payerEmail) data.payer_email = payerEmail;
  return data;
}

export function clearEphemeralCardToken(value: unknown): void {
  if (value && typeof value === "object" && !Array.isArray(value) && "token" in value) {
    (value as Record<string, unknown>).token = "";
  }
}

export function buildPixSessionData(emailValue: string, cpfValue: string): PixSessionData {
  const email = requiredString(emailValue, "O e-mail do pagador");
  const cpf = cpfValue.replace(/\D/g, "");
  if (cpf.length !== 11) {
    throw new PaymentContractError("Informe um CPF com 11 dígitos para gerar o Pix.");
  }
  return {
    payer_email: email,
    payer_identification: { type: "CPF", number: cpf },
  };
}

function isIpLiteral(hostname: string): boolean {
  return hostname.includes(":") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

export function validateThreeDSChallenge(value: unknown): ThreeDSChallenge {
  const challenge = asRecord(value);
  const externalResourceUrl = requiredString(
    challenge.external_resource_url,
    "A URL de continuação 3DS",
  );
  const creq = requiredString(challenge.creq, "A continuação 3DS");

  let url: URL;
  try {
    url = new URL(externalResourceUrl);
  } catch {
    throw new PaymentContractError("A URL de continuação 3DS está inválida.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (url.protocol !== "https:" || !hostname || url.username || url.password) {
    throw new PaymentContractError("A continuação 3DS exige uma URL HTTPS sem credenciais.");
  }
  if (
    isIpLiteral(hostname) ||
    isPrivateIpv4(hostname) ||
    hostname === "localhost" ||
    PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    !hostname.includes(".")
  ) {
    throw new PaymentContractError("O destino da continuação 3DS não é um host público válido.");
  }
  if (creq.length > 20_000 || !/^[A-Za-z0-9_-]+={0,2}$/.test(creq)) {
    throw new PaymentContractError("A continuação 3DS retornada pelo backend está inválida.");
  }

  return { externalResourceUrl: url.href, hostname, creq };
}

export function extractPaymentSession(
  collection: MercadoPagoPaymentCollection | null | undefined,
  providerId: MercadoPagoProviderId,
): MercadoPagoPaymentSession | null {
  if (!collection) return null;
  if (!Array.isArray(collection.payment_sessions)) {
    throw new PaymentContractError("O backend não retornou as sessões da cobrança.");
  }
  const matching = collection.payment_sessions.filter(
    (candidate) => candidate?.provider_id === providerId,
  );
  if (matching.length > 1) {
    throw new PaymentContractError("O backend retornou mais de uma sessão ativa para este método.");
  }
  return matching[0] ?? null;
}

export function classifyPaymentSession(session: MercadoPagoPaymentSession): PaymentSessionState {
  const data = asRecord(session.data);
  const providerStatus = optionalString(data.status)?.toLowerCase();
  const medusaStatus = optionalString(session.status)?.toLowerCase();
  const hasSuccess = Boolean(
    (providerStatus && SUCCESS_STATUSES.has(providerStatus)) ||
    (medusaStatus && SUCCESS_STATUSES.has(medusaStatus)),
  );
  const hasFailure = Boolean(
    (providerStatus && FAILURE_STATUSES.has(providerStatus)) ||
    (medusaStatus && FAILURE_STATUSES.has(medusaStatus)),
  );
  if (hasSuccess && hasFailure) {
    throw new PaymentContractError("O backend retornou estados terminais conflitantes.");
  }

  const statusDetail = optionalString(data.status_detail)?.toLowerCase();
  const hasChallengeData = data.three_ds_info !== undefined && data.three_ds_info !== null;
  const isChallenge = providerStatus === "pending" && statusDetail === "pending_challenge";
  if (statusDetail === "pending_challenge" && providerStatus !== "pending") {
    throw new PaymentContractError("O backend retornou um challenge 3DS com estado inconsistente.");
  }
  if (isChallenge && session.provider_id !== MERCADO_PAGO_CARD_PROVIDER_ID) {
    throw new PaymentContractError("O backend associou um challenge 3DS ao método incorreto.");
  }
  if (isChallenge && !hasChallengeData) {
    throw new PaymentContractError(
      "O backend não retornou os dados necessários para continuar o 3DS.",
    );
  }
  if (!isChallenge && hasChallengeData) {
    throw new PaymentContractError("O backend retornou continuação 3DS fora do estado esperado.");
  }
  if (isChallenge) {
    return {
      terminal: false,
      outcome: "challenge",
      status: providerStatus,
      challenge: validateThreeDSChallenge(data.three_ds_info),
    };
  }
  if (hasSuccess) {
    return {
      terminal: true,
      outcome: "succeeded",
      status: providerStatus || medusaStatus || "authorized",
    };
  }
  if (hasFailure) {
    return {
      terminal: true,
      outcome: "failed",
      status: providerStatus || medusaStatus || "error",
    };
  }
  return {
    terminal: false,
    outcome: "pending",
    status: providerStatus || medusaStatus || "pending",
  };
}

export function extractPixPresentation(session: MercadoPagoPaymentSession): PixPresentation {
  if (session.provider_id !== MERCADO_PAGO_PIX_PROVIDER_ID) {
    throw new PaymentContractError("A sessão retornada não pertence ao Pix.");
  }
  const data = asRecord(session.data);
  const pointOfInteraction = asRecord(data.point_of_interaction);
  const transactionData = asRecord(pointOfInteraction.transaction_data);
  const qrCode = optionalString(transactionData.qr_code);
  const qrCodeBase64 = optionalString(transactionData.qr_code_base64);
  const ticketUrlValue = optionalString(transactionData.ticket_url);
  const expiresAt = optionalString(data.date_of_expiration);

  if (qrCode && qrCode.length > 8_192) {
    throw new PaymentContractError("O código Pix retornado pelo backend excede o limite esperado.");
  }
  if (
    qrCodeBase64 &&
    (qrCodeBase64.length > 3_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(qrCodeBase64))
  ) {
    throw new PaymentContractError("A imagem Pix retornada pelo backend está inválida.");
  }

  let ticketUrl: string | undefined;
  if (ticketUrlValue) {
    try {
      const parsed = new URL(ticketUrlValue);
      if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error();
      ticketUrl = parsed.href;
    } catch {
      throw new PaymentContractError("O link Pix retornado pelo backend está inválido.");
    }
  }
  if (!qrCode && !qrCodeBase64 && !ticketUrl) {
    throw new PaymentContractError(
      "O backend não retornou QR Code, código Pix ou link de pagamento.",
    );
  }
  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
    throw new PaymentContractError("A expiração do Pix retornada pelo backend está inválida.");
  }
  return { qrCode, qrCodeBase64, ticketUrl, expiresAt };
}

export function findRecoverablePaymentSession(
  collection: MercadoPagoPaymentCollection | null | undefined,
): MercadoPagoPaymentSession | null {
  if (!collection?.payment_sessions) return null;
  const candidates = collection.payment_sessions.filter((session) => {
    if (!isMercadoPagoProviderId(session.provider_id)) return false;
    return classifyPaymentSession(session).outcome !== "failed";
  });
  if (candidates.length > 1) {
    throw new PaymentContractError("Há mais de uma tentativa de pagamento ativa no carrinho.");
  }
  return candidates[0] ?? null;
}

export const PAYMENT_POLL_INTERVAL_MS = 2_000;
export const PAYMENT_POLL_MAX_ATTEMPTS = 45;
export const PAYMENT_POLL_TIMEOUT_MS = PAYMENT_POLL_INTERVAL_MS * PAYMENT_POLL_MAX_ATTEMPTS;

function defaultSleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new PaymentPollingAbortedError());
      return;
    }
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new PaymentPollingAbortedError());
      },
      { once: true },
    );
  });
}

export async function pollPaymentSession(options: {
  retrieveSession: () => Promise<MercadoPagoPaymentSession>;
  signal?: AbortSignal;
  intervalMs?: number;
  maxAttempts?: number;
  sleep?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  onUpdate?: (session: MercadoPagoPaymentSession, state: PaymentSessionState) => void;
  stopOnChallenge?: boolean;
}): Promise<{ session: MercadoPagoPaymentSession; state: PaymentSessionState }> {
  const intervalMs = options.intervalMs ?? PAYMENT_POLL_INTERVAL_MS;
  const maxAttempts = options.maxAttempts ?? PAYMENT_POLL_MAX_ATTEMPTS;
  if (
    !Number.isSafeInteger(intervalMs) ||
    intervalMs < 0 ||
    intervalMs > PAYMENT_POLL_INTERVAL_MS
  ) {
    throw new PaymentContractError("O intervalo de consulta do pagamento está inválido.");
  }
  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > PAYMENT_POLL_MAX_ATTEMPTS
  ) {
    throw new PaymentContractError("O limite de consultas do pagamento está inválido.");
  }

  const sleep = options.sleep ?? defaultSleep;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.aborted) throw new PaymentPollingAbortedError();
    if (attempt > 1) await sleep(intervalMs, options.signal);
    const session = await options.retrieveSession();
    const state = classifyPaymentSession(session);
    options.onUpdate?.(session, state);
    if (state.terminal || (options.stopOnChallenge && state.outcome === "challenge")) {
      return { session, state };
    }
  }
  throw new PaymentPollingTimeoutError();
}
