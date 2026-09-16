import assert from "node:assert/strict";
import test from "node:test";
import {
  MERCADO_PAGO_CARD_PROVIDER_ID,
  MERCADO_PAGO_PIX_PROVIDER_ID,
  PaymentContractError,
  PaymentPollingAbortedError,
  PaymentPollingTimeoutError,
  PaymentSessionRecoveryError,
  buildCardSessionData,
  buildPixSessionData,
  classifyPaymentSession,
  clearEphemeralCardToken,
  extractPixPresentation,
  findRecoverablePaymentSession,
  methodToProviderId,
  normalizeCpfInput,
  pollPaymentSession,
  preparePixSubmission,
  providerIdToMethod,
  validateThreeDSChallenge,
} from "../src/lib/payments/mercado-pago-contract.ts";
import { PaymentApiError } from "../src/lib/payments/mercado-pago-api.ts";
import {
  challengeBehaviorForIntent,
  classifyPaymentError,
  confirmPaymentMethodSwitch,
} from "../src/lib/payments/mercado-pago-recovery.ts";

const pixSession = (providerStatus, medusaStatus = "pending_authorization", data = {}) => ({
  provider_id: MERCADO_PAGO_PIX_PROVIDER_ID,
  status: medusaStatus,
  data: { status: providerStatus, ...data },
});

const cardSession = (providerStatus, medusaStatus = "pending_authorization", data = {}) => ({
  provider_id: MERCADO_PAGO_CARD_PROVIDER_ID,
  status: medusaStatus,
  data: { status: providerStatus, ...data },
});

test("payment selection maps Pix, card, then Pix to the real provider ids", () => {
  const selections = ["pix", "card", "pix"].map(methodToProviderId);
  assert.deepEqual(selections, [
    MERCADO_PAGO_PIX_PROVIDER_ID,
    MERCADO_PAGO_CARD_PROVIDER_ID,
    MERCADO_PAGO_PIX_PROVIDER_ID,
  ]);
  assert.equal(providerIdToMethod(MERCADO_PAGO_CARD_PROVIDER_ID), "card");
  assert.equal(providerIdToMethod("pp_unrelated"), null);
});

test("card payload is allowlisted, requires its token, and clears it after use", () => {
  const brickOutput = {
    token: "ephemeral-token",
    transaction_amount: "1990",
    installments: "2",
    payment_method_id: "visa",
    issuer_id: "issuer-local",
    unexpected_field: "must-not-pass",
    payer: {
      email: "buyer@example.invalid",
      identification: { type: "CPF", number: "must-not-pass" },
      unexpected_name: "must-not-pass",
    },
    three_ds_info: { external_resource_url: "must-not-pass" },
  };

  const payload = buildCardSessionData(brickOutput, 1990);
  assert.deepEqual(payload, {
    token: "ephemeral-token",
    payment_method_id: "visa",
    installments: 2,
    issuer_id: "issuer-local",
    payer_email: "buyer@example.invalid",
  });
  assert.deepEqual(Object.keys(payload).sort(), [
    "installments",
    "issuer_id",
    "payer_email",
    "payment_method_id",
    "token",
  ]);
  clearEphemeralCardToken(brickOutput);
  assert.equal(brickOutput.token, "");
  assert.throws(
    () => buildCardSessionData({ ...brickOutput, transaction_amount: 1991 }, 1990),
    PaymentContractError,
  );
  assert.throws(
    () =>
      buildCardSessionData(
        { transaction_amount: 1990, installments: 1, payment_method_id: "visa" },
        1990,
      ),
    PaymentContractError,
  );
});

test("Pix payload contains only backend-approved payer fields", () => {
  assert.deepEqual(buildPixSessionData("buyer@example.invalid", "000.000.000-00"), {
    payer_email: "buyer@example.invalid",
    payer_identification: { type: "CPF", number: "00000000000" },
  });
  assert.throws(() => buildPixSessionData("buyer@example.invalid", "short"), PaymentContractError);
});

test("Pix CPF preparation rejects 10 or 12 digits without producing session data", () => {
  for (const cpf of ["1234567890", "123456789012"]) {
    const preparation = preparePixSubmission("buyer@example.invalid", cpf);
    assert.deepEqual(preparation, {
      ready: false,
      normalizedCpf: cpf,
      error: "Informe um CPF com 11 dígitos para gerar o Pix.",
    });
    assert.equal("data" in preparation, false);
  }
});

test("Pix CPF input keeps digits only, normalizes formatting, and can be corrected", () => {
  assert.equal(normalizeCpfInput("123.456.789-00"), "12345678900");
  const formatted = preparePixSubmission("buyer@example.invalid", "123.456.789-00");
  assert.equal(formatted.ready, true);
  assert.deepEqual(formatted.ready && formatted.data.payer_identification, {
    type: "CPF",
    number: "12345678900",
  });

  const invalid = preparePixSubmission("buyer@example.invalid", "1234567890");
  const corrected = preparePixSubmission("buyer@example.invalid", "12345678900");
  assert.equal(invalid.ready, false);
  assert.equal(corrected.ready, true);
});

test("Pix pending data renders only values returned by the backend", () => {
  const presentation = extractPixPresentation(
    pixSession("pending", "pending_authorization", {
      date_of_expiration: "2030-01-01T12:00:00.000Z",
      point_of_interaction: {
        transaction_data: {
          qr_code: "pix-payload-local",
          qr_code_base64: "cGl4",
          ticket_url: "https://payments.example.test/ticket",
        },
      },
    }),
  );
  assert.deepEqual(presentation, {
    qrCode: "pix-payload-local",
    qrCodeBase64: "cGl4",
    ticketUrl: "https://payments.example.test/ticket",
    expiresAt: "2030-01-01T12:00:00.000Z",
  });
  assert.throws(
    () =>
      extractPixPresentation(
        pixSession("pending", "pending_authorization", {
          point_of_interaction: { transaction_data: {} },
        }),
      ),
    PaymentContractError,
  );
});

test("3DS accepts only complete backend-shaped HTTPS continuation data", () => {
  assert.deepEqual(
    validateThreeDSChallenge({
      external_resource_url: "https://acs.example.test/challenge",
      creq: "abc_DEF-123",
    }),
    {
      externalResourceUrl: "https://acs.example.test/challenge",
      hostname: "acs.example.test",
      creq: "abc_DEF-123",
    },
  );
  for (const external_resource_url of [
    "http://acs.example.test/challenge",
    "https://localhost/challenge",
    "https://127.0.0.1/challenge",
    "https://user:pass@acs.example.test/challenge",
  ]) {
    assert.throws(
      () => validateThreeDSChallenge({ external_resource_url, creq: "abc_DEF-123" }),
      PaymentContractError,
    );
  }
  assert.throws(
    () => validateThreeDSChallenge({ external_resource_url: "https://acs.example.test/challenge" }),
    PaymentContractError,
  );
});

test("a 3DS challenge never classifies as approved and must come from card session data", () => {
  const challenge = classifyPaymentSession(
    cardSession("pending", "pending_authorization", {
      status_detail: "pending_challenge",
      three_ds_info: {
        external_resource_url: "https://acs.example.test/challenge",
        creq: "abc_DEF-123",
      },
    }),
  );
  assert.equal(challenge.outcome, "challenge");
  assert.equal(challenge.terminal, false);
  assert.throws(
    () =>
      classifyPaymentSession(
        cardSession("authorized", "authorized", {
          status_detail: "pending_challenge",
          three_ds_info: {
            external_resource_url: "https://acs.example.test/challenge",
            creq: "abc_DEF-123",
          },
        }),
      ),
    PaymentContractError,
  );
  assert.deepEqual(
    classifyPaymentSession({
      provider_id: MERCADO_PAGO_CARD_PROVIDER_ID,
      status: "pending_authorization",
      data: { status: "pending" },
      three_ds_info: {
        external_resource_url: "https://client.example.test/challenge",
        creq: "client_supplied",
      },
    }),
    { terminal: false, outcome: "pending", status: "pending" },
  );
});

test("an incomplete live 3DS session is recoverable while structural config stays fatal", () => {
  const incompleteChallenge = cardSession("pending", "pending_authorization", {
    status_detail: "pending_challenge",
  });
  let contractError;
  try {
    classifyPaymentSession(incompleteChallenge);
  } catch (error) {
    contractError = error;
  }
  assert.ok(contractError instanceof PaymentContractError);
  assert.equal(classifyPaymentError(contractError, "active-session"), "recoverable");
  assert.equal(
    classifyPaymentError(
      new PaymentApiError("A chave pública da Store API não está configurada.", false),
      "preflight",
    ),
    "fatal",
  );
  assert.equal(
    classifyPaymentError(new PaymentContractError("config inválida"), "preflight"),
    "fatal",
  );
});

test("explicit API recoverability takes precedence over an active session", () => {
  assert.equal(
    classifyPaymentError(new PaymentApiError("A sessão desapareceu.", false), "active-session"),
    "fatal",
  );
  assert.equal(
    classifyPaymentError(new PaymentApiError("Falha transitória.", true), "active-session"),
    "recoverable",
  );
});

test("temporarily incomplete live Pix data is recoverable and never succeeds", () => {
  const incompletePix = pixSession("pending", "pending_authorization", {
    point_of_interaction: { transaction_data: {} },
  });
  const state = classifyPaymentSession(incompletePix);
  assert.equal(state.outcome, "pending");
  let contractError;
  try {
    extractPixPresentation(incompletePix);
  } catch (error) {
    contractError = error;
  }
  assert.ok(contractError instanceof PaymentContractError);
  assert.equal(classifyPaymentError(contractError, "active-session"), "recoverable");
});

test("backend payment status controls terminal success and failure", () => {
  assert.deepEqual(classifyPaymentSession(cardSession("authorized", "authorized")), {
    terminal: true,
    outcome: "succeeded",
    status: "authorized",
  });
  assert.deepEqual(classifyPaymentSession(pixSession("rejected", "error")), {
    terminal: true,
    outcome: "failed",
    status: "rejected",
  });
  assert.throws(
    () => classifyPaymentSession(cardSession("rejected", "authorized")),
    PaymentContractError,
  );
});

test("polling stops on backend success and backend failure", async () => {
  for (const terminalSession of [
    cardSession("authorized", "authorized"),
    cardSession("rejected", "error"),
  ]) {
    const responses = [cardSession("pending"), terminalSession];
    let calls = 0;
    const result = await pollPaymentSession({
      retrieveSession: async () => {
        calls += 1;
        return responses.shift();
      },
      intervalMs: 0,
      maxAttempts: 2,
      sleep: async () => {},
    });
    assert.equal(result.state.terminal, true);
    assert.equal(calls, 2);
  }
});

test("recovery returns a 3DS challenge immediately without waiting for the polling bound", async () => {
  let calls = 0;
  const challengeSession = cardSession("pending", "pending_authorization", {
    status_detail: "pending_challenge",
    three_ds_info: {
      external_resource_url: "https://acs.example.test/challenge",
      creq: "abc_DEF-123",
    },
  });
  const result = await pollPaymentSession({
    retrieveSession: async () => {
      calls += 1;
      return challengeSession;
    },
    challengeBehavior: challengeBehaviorForIntent("recover-session"),
    intervalMs: 0,
    maxAttempts: 45,
    sleep: async () => {},
  });
  assert.equal(result.state.outcome, "challenge");
  assert.equal(result.state.terminal, false);
  assert.equal(calls, 1);
});

test("post-challenge status check continues through challenge until backend success", async () => {
  const responses = [
    cardSession("pending", "pending_authorization", {
      status_detail: "pending_challenge",
      three_ds_info: {
        external_resource_url: "https://acs.example.test/challenge",
        creq: "abc_DEF-123",
      },
    }),
    cardSession("authorized", "authorized"),
  ];
  let calls = 0;
  const result = await pollPaymentSession({
    retrieveSession: async () => {
      calls += 1;
      return responses.shift();
    },
    challengeBehavior: challengeBehaviorForIntent("post-challenge"),
    intervalMs: 0,
    maxAttempts: 2,
    sleep: async () => {},
  });
  assert.equal(result.state.outcome, "succeeded");
  assert.equal(calls, 2);
});

test("polling has a bounded timeout", async () => {
  let calls = 0;
  await assert.rejects(
    pollPaymentSession({
      retrieveSession: async () => {
        calls += 1;
        return cardSession("pending");
      },
      intervalMs: 0,
      maxAttempts: 2,
      sleep: async () => {},
    }),
    PaymentPollingTimeoutError,
  );
  assert.equal(calls, 2);
});

test("method switch or unmount can abort polling cleanup", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(
    pollPaymentSession({
      signal: controller.signal,
      retrieveSession: async () => {
        calls += 1;
        return cardSession("pending");
      },
      intervalMs: 0,
      maxAttempts: 3,
      sleep: async (_milliseconds, signal) => {
        controller.abort();
        if (signal?.aborted) throw new PaymentPollingAbortedError();
      },
    }),
    PaymentPollingAbortedError,
  );
  assert.equal(calls, 1);
});

test("refresh recovery is reconstructed from the single backend session", () => {
  const pendingPix = pixSession("pending", "pending_authorization", {
    point_of_interaction: { transaction_data: { qr_code: "pix-payload-local" } },
  });
  assert.equal(
    findRecoverablePaymentSession({ id: "pay_col_local", payment_sessions: [pendingPix] }),
    pendingPix,
  );
  assert.equal(
    findRecoverablePaymentSession({
      id: "pay_col_local",
      payment_sessions: [cardSession("rejected", "error")],
    }),
    null,
  );
  assert.throws(
    () =>
      findRecoverablePaymentSession({
        id: "pay_col_local",
        payment_sessions: [pendingPix, cardSession("pending")],
      }),
    PaymentContractError,
  );
});

test("recovery ignores malformed MP sessions when a valid live session exists", () => {
  const malformed = cardSession("pending", "pending_authorization", {
    status_detail: "pending_challenge",
  });
  const valid = pixSession("pending", "pending_authorization", {
    point_of_interaction: { transaction_data: { qr_code: "pix-payload-local" } },
  });
  assert.equal(
    findRecoverablePaymentSession({
      id: "pay_col_local",
      payment_sessions: [malformed, valid],
    }),
    valid,
  );
});

test("recovery with only malformed MP sessions fails closed but remains retryable", () => {
  assert.throws(
    () =>
      findRecoverablePaymentSession({
        id: "pay_col_local",
        payment_sessions: [
          cardSession("pending", "pending_authorization", {
            status_detail: "pending_challenge",
          }),
        ],
      }),
    (error) =>
      error instanceof PaymentSessionRecoveryError &&
      classifyPaymentError(error, "preflight") === "recoverable",
  );
});

test("pending Pix method switch requires an explicit confirmation decision", () => {
  const options = {
    currentMethod: "pix",
    nextMethod: "card",
    activeProviderId: MERCADO_PAGO_PIX_PROVIDER_ID,
  };
  let confirmations = 0;
  assert.equal(
    confirmPaymentMethodSwitch(options, () => {
      confirmations += 1;
      return false;
    }),
    false,
  );
  assert.equal(confirmations, 1);
  assert.equal(
    confirmPaymentMethodSwitch(options, () => {
      confirmations += 1;
      return true;
    }),
    true,
  );
  assert.equal(confirmations, 2);
});
