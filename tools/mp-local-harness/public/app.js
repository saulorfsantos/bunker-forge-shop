const config = globalThis.__MP_HARNESS_CONFIG__;
const statusNode = document.querySelector("#status");
const challengePanel = document.querySelector("#challenge-panel");

function setStatus(message, kind = "info") {
  statusNode.textContent = message;
  statusNode.dataset.kind = kind;
}

function startThreeDsChallenge(threeDsInfo) {
  let challengeUrl;
  try {
    challengeUrl = new URL(threeDsInfo.external_resource_url);
  } catch {
    throw new Error("invalid_3ds_url");
  }

  if (challengeUrl.protocol !== "https:" || typeof threeDsInfo.creq !== "string") {
    throw new Error("unsafe_3ds_challenge");
  }

  const form = document.createElement("form");
  const challengeRequest = document.createElement("input");
  form.method = "POST";
  form.action = challengeUrl.href;
  form.target = "mp-3ds-challenge";
  form.hidden = true;
  challengeRequest.type = "hidden";
  challengeRequest.name = "creq";
  challengeRequest.value = threeDsInfo.creq;
  form.append(challengeRequest);
  document.body.append(form);
  challengePanel.hidden = false;
  form.submit();

  challengeRequest.value = "";
  form.remove();
  threeDsInfo.creq = "";
  setStatus("Desafio 3DS iniciado. Conclua a autenticação no quadro seguro.");
}

function tokenizedPayload(cardFormData) {
  return {
    token: cardFormData.token,
    transaction_amount: Number(cardFormData.transaction_amount),
    issuer_id: cardFormData.issuer_id,
    payment_method_id: cardFormData.payment_method_id,
    installments: cardFormData.installments,
    payer: cardFormData.payer,
  };
}

async function submitTokenizedPayment(cardFormData) {
  const payload = tokenizedPayload(cardFormData);
  cardFormData.token = "";
  setStatus("Token gerado no browser; enviando somente dados tokenizados ao backend local…");

  try {
    const response = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    payload.token = "";

    if (!response.ok) {
      throw new Error("local_backend_rejected");
    }

    const result = await response.json();
    if (result.three_ds_info) {
      startThreeDsChallenge(result.three_ds_info);
      return;
    }

    setStatus(`Resposta local recebida: ${result.status ?? "unknown"}.`, "success");
  } catch {
    payload.token = "";
    setStatus("Falha segura: o backend local não aceitou a operação.", "error");
    throw new Error("tokenized_payment_failed");
  }
}

async function initialize() {
  if (!config?.publicKey || !Number.isFinite(config.amount) || !globalThis.MercadoPago) {
    setStatus("Configuração runtime ou SDK indisponível; operação interrompida.", "error");
    return;
  }

  const mercadoPago = new globalThis.MercadoPago(config.publicKey, { locale: "pt-BR" });
  const bricks = mercadoPago.bricks();

  await bricks.create("cardPayment", "cardPaymentBrick_container", {
    initialization: { amount: config.amount },
    customization: {
      paymentMethods: { maxInstallments: 1 },
      visual: { style: { theme: "dark" } },
    },
    callbacks: {
      onReady: () => setStatus("Brick pronto. Use somente dados de teste do Mercado Pago."),
      onSubmit: submitTokenizedPayment,
      onError: () => setStatus("O Brick rejeitou a operação sem expor dados sensíveis.", "error"),
    },
  });
}

initialize().catch(() => {
  setStatus("Inicialização interrompida com segurança.", "error");
});
