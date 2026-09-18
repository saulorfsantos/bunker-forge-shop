import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Clipboard,
  Clock3,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  QrCode,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { createSubmissionLock } from "@/lib/checkout-attempt";
import type { CheckoutCart, OrderReceipt } from "@/lib/checkout";
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/lib/medusa";
import { createMercadoPagoStoreApi } from "@/lib/payments/mercado-pago-api";
import {
  MERCADO_PAGO_CARD_PROVIDER_ID,
  MERCADO_PAGO_PIX_PROVIDER_ID,
  PaymentContractError,
  PaymentPollingAbortedError,
  PaymentPollingTimeoutError,
  buildCardSessionData,
  classifyPaymentSession,
  clearEphemeralCardToken,
  extractPixPresentation,
  findRecoverablePaymentSession,
  methodToProviderId,
  normalizeCpfInput,
  pollPaymentSession,
  preparePixSubmission,
  providerIdToMethod,
  resolveMercadoPagoCapabilities,
  type MercadoPagoMethod,
  type MercadoPagoPaymentSession,
  type MercadoPagoProviderId,
  type PixPresentation,
  type ThreeDSChallenge,
} from "@/lib/payments/mercado-pago-contract";
import {
  challengeBehaviorForIntent,
  classifyPaymentError,
  confirmPaymentMethodSwitch,
  type PaymentErrorContext,
  type PaymentPollingIntent,
} from "@/lib/payments/mercado-pago-recovery";
import {
  createCardSubmitLifecycle,
  getMercadoPagoPublicKey,
  mountCardPaymentBrick,
  type MercadoPagoSdkLoader,
} from "@/lib/payments/mercado-pago-browser";

type PaymentUiState =
  | "idle"
  | "loading"
  | "ready"
  | "pending"
  | "challenge"
  | "success"
  | "recoverable-error"
  | "fatal-error";

interface MercadoPagoCheckoutProps {
  cart: CheckoutCart;
  availableProviderIds: string[];
  onBack: () => void;
  onOrder: (order: OrderReceipt) => Promise<void> | void;
}

const inputClassName =
  "mt-1.5 w-full rounded-sm border border-bunker-graphite bg-bunker-black px-3 py-2.5 text-sm text-bunker-text-primary outline-none transition-colors placeholder:text-bunker-text-secondary/60 focus:border-bunker-tan focus:ring-1 focus:ring-bunker-tan disabled:opacity-60";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível continuar o pagamento. Tente novamente.";
}

export function MercadoPagoCheckout({
  cart,
  availableProviderIds,
  onBack,
  onOrder,
}: MercadoPagoCheckoutProps) {
  const capabilities = useMemo(
    () => resolveMercadoPagoCapabilities(availableProviderIds),
    [availableProviderIds],
  );
  const api = useMemo(
    () =>
      createMercadoPagoStoreApi({
        backendUrl: MEDUSA_BACKEND_URL,
        publishableKey: MEDUSA_PUBLISHABLE_KEY,
      }),
    [],
  );
  const [method, setMethod] = useState<MercadoPagoMethod>(() =>
    capabilities.card && !capabilities.pix ? "card" : "pix",
  );
  const [phase, setPhase] = useState<PaymentUiState>("idle");
  const [message, setMessage] = useState("Preparando formas de pagamento...");
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixPresentation | null>(null);
  const [copied, setCopied] = useState(false);
  const [challenge, setChallenge] = useState<ThreeDSChallenge | null>(null);
  const [shouldMountCard, setShouldMountCard] = useState(false);
  const pollingController = useRef<AbortController | null>(null);
  const submissionLock = useRef(createSubmissionLock());
  const completionLock = useRef(createSubmissionLock());
  const activeSessionProvider = useRef<MercadoPagoProviderId | null>(null);
  const mounted = useRef(true);

  const cancelPolling = useCallback(() => {
    pollingController.current?.abort();
    pollingController.current = null;
  }, []);

  const showError = useCallback((error: unknown, context?: PaymentErrorContext) => {
    if (error instanceof PaymentPollingAbortedError) return;
    const errorContext =
      context ?? (activeSessionProvider.current ? "active-session" : "preflight");
    setMessage(errorMessage(error));
    setPhase(
      classifyPaymentError(error, errorContext) === "fatal" ? "fatal-error" : "recoverable-error",
    );
  }, []);

  const completeApprovedPayment = useCallback(async () => {
    if (!completionLock.current.tryAcquire()) return;
    cancelPolling();
    setPhase("success");
    setMessage("Pagamento confirmado. Finalizando seu pedido...");
    try {
      const order = await api.completeCart(cart.id);
      if (!mounted.current) return;
      await onOrder(order as OrderReceipt);
    } catch (error) {
      completionLock.current.release();
      if (mounted.current) showError(error);
    }
  }, [api, cancelPolling, cart.id, onOrder, showError]);

  const applySession = useCallback(
    async (session: MercadoPagoPaymentSession, pollAfterPending: boolean) => {
      if (providerIdToMethod(session.provider_id)) {
        activeSessionProvider.current = session.provider_id as MercadoPagoProviderId;
      }
      const state = classifyPaymentSession(session);
      if (state.outcome === "succeeded") {
        await completeApprovedPayment();
        return;
      }
      if (state.outcome === "failed") {
        activeSessionProvider.current = null;
        setPhase("recoverable-error");
        setMessage(`O pagamento foi encerrado (${state.status}). Inicie uma nova tentativa.`);
        return;
      }
      if (state.outcome === "challenge") {
        setChallenge(state.challenge);
        setPhase("challenge");
        setMessage("O emissor solicitou uma verificação 3DS antes de autorizar o pagamento.");
        return;
      }
      if (session.provider_id === MERCADO_PAGO_PIX_PROVIDER_ID) {
        setPix(extractPixPresentation(session));
      }
      setPhase("pending");
      setMessage("Aguardando confirmação do pagamento...");
      if (pollAfterPending) {
        // The polling lifecycle is started by the caller after this state is committed.
      }
    },
    [completeApprovedPayment],
  );

  const startPolling = useCallback(
    (providerId: MercadoPagoProviderId, intent: PaymentPollingIntent) => {
      cancelPolling();
      activeSessionProvider.current = providerId;
      const controller = new AbortController();
      pollingController.current = controller;
      void pollPaymentSession({
        signal: controller.signal,
        challengeBehavior: challengeBehaviorForIntent(intent),
        retrieveSession: () => api.retrievePaymentSession(cart.id, providerId, controller.signal),
        onUpdate: (session, state) => {
          if (!mounted.current || controller.signal.aborted) return;
          if (session.provider_id === MERCADO_PAGO_PIX_PROVIDER_ID && state.outcome === "pending") {
            setPix(extractPixPresentation(session));
          }
          if (state.outcome === "pending" || state.outcome === "challenge") {
            setMessage("Aguardando confirmação do pagamento...");
          }
        },
      })
        .then(async ({ session, state }) => {
          if (!mounted.current || controller.signal.aborted) return;
          pollingController.current = null;
          if (state.outcome === "challenge") {
            setChallenge(state.challenge);
            setPhase("challenge");
            setMessage("O emissor solicitou uma verificação 3DS.");
            return;
          }
          await applySession(session, false);
        })
        .catch((error) => {
          if (!mounted.current || controller.signal.aborted) return;
          pollingController.current = null;
          if (error instanceof PaymentPollingTimeoutError) {
            setPhase("recoverable-error");
            setMessage(
              "A consulta atingiu o limite seguro de 90 segundos. O pagamento não foi considerado aprovado.",
            );
            return;
          }
          showError(error, "active-session");
        });
    },
    [api, applySession, cancelPolling, cart.id, showError],
  );

  const acceptSession = useCallback(
    async (session: MercadoPagoPaymentSession) => {
      if (providerIdToMethod(session.provider_id)) {
        activeSessionProvider.current = session.provider_id as MercadoPagoProviderId;
      }
      const state = classifyPaymentSession(session);
      await applySession(session, true);
      if (state.outcome === "pending") {
        startPolling(session.provider_id as MercadoPagoProviderId, "monitor-pending");
      }
    },
    [applySession, startPolling],
  );

  useEffect(() => {
    mounted.current = true;
    if (capabilities.methods.length === 0) {
      setPhase("fatal-error");
      setMessage("Nenhuma forma de pagamento compatível está disponível no momento.");
      return () => {
        mounted.current = false;
        cancelPolling();
      };
    }

    try {
      const recovered = findRecoverablePaymentSession(cart.payment_collection);
      if (recovered) {
        const recoveredMethod = providerIdToMethod(recovered.provider_id);
        if (!recoveredMethod) throw new PaymentContractError("O método recuperado é inválido.");
        if (capabilities[recoveredMethod]) {
          setMethod(recoveredMethod);
          setShouldMountCard(false);
          setPhase("loading");
          setMessage("Consultando sua tentativa de pagamento...");
          void acceptSession(recovered).catch(showError);
          return () => {
            mounted.current = false;
            cancelPolling();
          };
        }
      }

      const initialMethod: MercadoPagoMethod = capabilities.pix ? "pix" : "card";
      setMethod(initialMethod);
      setShouldMountCard(initialMethod === "card");
      setPhase("ready");
      setMessage(
        capabilities.pix && capabilities.card
          ? "Escolha Pix ou cartão para continuar."
          : initialMethod === "pix"
            ? "Pix está disponível para este checkout."
            : "Cartão está disponível para este checkout.",
      );
    } catch (error) {
      showError(error);
    }

    return () => {
      mounted.current = false;
      cancelPolling();
    };
  }, [acceptSession, cancelPolling, capabilities, cart.payment_collection, showError]);

  const selectMethod = (nextMethod: MercadoPagoMethod) => {
    if (phase === "loading" || phase === "success") return;
    if (!capabilities[nextMethod]) return;
    if (nextMethod === method) return;
    if (
      !confirmPaymentMethodSwitch(
        {
          currentMethod: method,
          nextMethod,
          activeProviderId: activeSessionProvider.current,
        },
        () =>
          window.confirm(
            "Há uma cobrança Pix aguardando pagamento. Trocar para cartão abandonará essa cobrança e uma nova sessão será criada somente após sua confirmação. Deseja continuar?",
          ),
      )
    ) {
      return;
    }
    cancelPolling();
    submissionLock.current.release();
    activeSessionProvider.current = null;
    setMethod(nextMethod);
    setShouldMountCard(nextMethod === "card");
    setPix(null);
    setCopied(false);
    setChallenge(null);
    setCpfError(null);
    setPhase("ready");
    setMessage(
      nextMethod === "pix"
        ? "Informe o CPF do pagador para gerar um novo Pix."
        : "Use o formulário seguro do Mercado Pago para pagar com cartão.",
    );
  };

  const submitPix = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let submission: ReturnType<typeof preparePixSubmission>;
    try {
      submission = preparePixSubmission(cart.email ?? "", cpf);
    } catch (error) {
      showError(error, "preflight");
      return;
    }
    setCpf(submission.normalizedCpf);
    if (!submission.ready) {
      setCpfError(submission.error);
      return;
    }
    setCpfError(null);
    if (!submissionLock.current.tryAcquire()) return;
    cancelPolling();
    setPix(null);
    setChallenge(null);
    setPhase("loading");
    setMessage("Gerando seu Pix...");
    try {
      const { session } = await api.initiatePaymentSession(
        cart.id,
        MERCADO_PAGO_PIX_PROVIDER_ID,
        submission.data,
      );
      if (mounted.current) await acceptSession(session);
    } catch (error) {
      if (mounted.current) showError(error);
    } finally {
      submissionLock.current.release();
    }
  };

  const submitCardToken = useCallback(
    async (formData: unknown) => {
      if (!submissionLock.current.tryAcquire()) return;
      cancelPolling();
      setChallenge(null);
      setPhase("loading");
      setMessage("Processando pagamento...");
      try {
        const data = buildCardSessionData(formData, cart.total ?? 0);
        const { session } = await api.initiatePaymentSession(
          cart.id,
          MERCADO_PAGO_CARD_PROVIDER_ID,
          data,
        );
        if (mounted.current) await acceptSession(session);
        if (mounted.current) setShouldMountCard(false);
      } catch (error) {
        if (mounted.current) showError(error);
        throw error;
      } finally {
        clearEphemeralCardToken(formData);
        submissionLock.current.release();
      }
    },
    [acceptSession, api, cancelPolling, cart.id, cart.total, showError],
  );

  const copyPixCode = async () => {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
      setMessage(
        "Não foi possível copiar automaticamente. Selecione o código e copie manualmente.",
      );
    }
  };

  const retryStatus = () => {
    setPhase("pending");
    setMessage("Consultando o pagamento novamente...");
    startPolling(methodToProviderId(method), "recover-session");
  };

  return (
    <div
      className="border border-bunker-graphite bg-bunker-charcoal p-5 md:p-7"
      data-payment-state={phase}
    >
      <div className="flex items-center gap-3 border-b border-bunker-graphite pb-5">
        <ShieldCheck className="h-6 w-6 text-bunker-tan" />
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider">Pagamento seguro</h2>
          <p className="text-xs text-bunker-text-secondary">
            Seus dados de pagamento são processados com segurança pelo Mercado Pago.
          </p>
        </div>
      </div>

      <div
        className={`mt-5 grid gap-3 ${capabilities.methods.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        role="radiogroup"
        aria-label="Forma de pagamento"
      >
        {capabilities.pix && (
          <PaymentMethodButton
            active={method === "pix"}
            disabled={phase === "loading" || phase === "success"}
            icon={<QrCode className="h-5 w-5" />}
            label="Pix"
            onClick={() => selectMethod("pix")}
          />
        )}
        {capabilities.card && (
          <PaymentMethodButton
            active={method === "card"}
            disabled={phase === "loading" || phase === "success"}
            icon={<CreditCard className="h-5 w-5" />}
            label="Cartão"
            onClick={() => selectMethod("card")}
          />
        )}
      </div>

      <PaymentStatus phase={phase} message={message} />

      {method === "pix" && phase !== "fatal-error" && (
        <PixPanel
          cpf={cpf}
          cpfError={cpfError}
          disabled={phase === "loading" || phase === "success" || phase === "challenge"}
          phase={phase}
          pix={pix}
          copied={copied}
          onCpfChange={(value) => {
            setCpf(normalizeCpfInput(value));
            setCpfError(null);
          }}
          onCopy={() => void copyPixCode()}
          onSubmit={(event) => void submitPix(event)}
        />
      )}

      {method === "card" && phase !== "fatal-error" && shouldMountCard && (
        <CardPaymentBrick
          amount={cart.total ?? 0}
          email={cart.email ?? ""}
          disabled={phase === "success" || phase === "challenge"}
          onFatal={showError}
          onReady={() => {
            if (phase !== "pending" && phase !== "challenge" && phase !== "success") {
              setPhase("ready");
              setMessage("Formulário seguro pronto para pagamento.");
            }
          }}
          onSubmit={submitCardToken}
        />
      )}

      {phase === "challenge" && challenge && (
        <ThreeDSPanel
          challenge={challenge}
          onCheck={() => {
            setPhase("pending");
            setMessage("Aguardando confirmação do pagamento...");
            startPolling(MERCADO_PAGO_CARD_PROVIDER_ID, "post-challenge");
          }}
        />
      )}

      {phase === "recoverable-error" && (
        <button
          type="button"
          onClick={retryStatus}
          className="mt-4 flex w-full items-center justify-center gap-2 border border-bunker-tan px-4 py-3 text-xs font-bold uppercase tracking-wider text-bunker-tan transition-colors hover:bg-bunker-tan hover:text-bunker-black"
        >
          <RefreshCw className="h-4 w-4" /> Consultar pagamento novamente
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          cancelPolling();
          onBack();
        }}
        disabled={phase === "loading" || phase === "success"}
        className="mt-5 w-full border border-bunker-graphite py-2.5 text-xs font-bold uppercase tracking-wider text-bunker-text-secondary transition-colors hover:border-bunker-tan hover:text-bunker-tan disabled:cursor-not-allowed disabled:opacity-50"
      >
        Editar recebimento
      </button>
    </div>
  );
}

function PaymentMethodButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 border px-4 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
        active
          ? "border-bunker-tan bg-bunker-tan/10 text-bunker-tan"
          : "border-bunker-graphite bg-bunker-black text-bunker-text-secondary hover:border-bunker-tan/60"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon} {label}
    </button>
  );
}

function PaymentStatus({ phase, message }: { phase: PaymentUiState; message: string }) {
  const danger = phase === "fatal-error" || phase === "recoverable-error";
  return (
    <div
      className={`mt-4 flex items-start gap-3 border-l-2 px-4 py-3 text-sm ${
        danger
          ? "border-bunker-danger bg-bunker-danger/10"
          : "border-bunker-military-light bg-bunker-military/10"
      }`}
      role={danger ? "alert" : "status"}
      aria-live="polite"
    >
      {phase === "loading" || phase === "pending" ? (
        <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-bunker-tan" />
      ) : danger ? (
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-bunker-danger" />
      ) : phase === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-bunker-military-light" />
      ) : (
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-bunker-military-light" />
      )}
      <span className="leading-relaxed text-bunker-text-secondary">{message}</span>
    </div>
  );
}

function PixPanel({
  cpf,
  cpfError,
  disabled,
  phase,
  pix,
  copied,
  onCpfChange,
  onCopy,
  onSubmit,
}: {
  cpf: string;
  cpfError: string | null;
  disabled: boolean;
  phase: PaymentUiState;
  pix: PixPresentation | null;
  copied: boolean;
  onCpfChange: (value: string) => void;
  onCopy: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const cpfErrorId = useId();
  return (
    <div className="mt-5">
      {!pix && (
        <form onSubmit={onSubmit}>
          <label className="text-xs font-semibold uppercase tracking-wider text-bunker-text-secondary">
            CPF do pagador
            <input
              className={inputClassName}
              inputMode="numeric"
              autoComplete="off"
              value={cpf}
              onChange={(event) => onCpfChange(event.target.value)}
              placeholder="000.000.000-00"
              pattern="[0-9]*"
              aria-invalid={Boolean(cpfError)}
              aria-describedby={cpfError ? cpfErrorId : undefined}
              disabled={disabled}
              required
            />
          </label>
          {cpfError && (
            <p id={cpfErrorId} role="alert" className="mt-2 text-sm text-bunker-danger">
              {cpfError}
            </p>
          )}
          <button
            type="submit"
            disabled={disabled}
            className="mt-4 flex w-full items-center justify-center gap-2 bg-bunker-tan py-3 text-sm font-bold uppercase tracking-wider text-bunker-black transition-colors hover:bg-bunker-tan-dark disabled:cursor-wait disabled:opacity-60"
          >
            {phase === "loading" && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Gerar novo Pix
          </button>
        </form>
      )}

      {pix && (
        <div className="border border-bunker-graphite bg-bunker-black p-4">
          <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
            {pix.qrCodeBase64 ? (
              <img
                src={`data:image/png;base64,${pix.qrCodeBase64}`}
                alt="QR Code Pix para pagamento"
                className="mx-auto aspect-square w-full max-w-[180px] bg-white p-2"
              />
            ) : (
              <div className="mx-auto grid aspect-square w-full max-w-[180px] place-items-center border border-dashed border-bunker-graphite">
                <QrCode className="h-12 w-12 text-bunker-text-secondary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-bunker-tan">
                Pix aguardando pagamento
              </p>
              {pix.expiresAt && (
                <p className="mt-2 flex items-center gap-2 text-xs text-bunker-text-secondary">
                  <Clock3 className="h-4 w-4" /> Expira em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(pix.expiresAt))}
                </p>
              )}
              {pix.qrCode && (
                <>
                  <textarea
                    readOnly
                    value={pix.qrCode}
                    aria-label="Código Pix copia e cola"
                    className="mt-3 h-20 w-full resize-none border border-bunker-graphite bg-bunker-charcoal p-2 text-xs text-bunker-text-secondary outline-none"
                  />
                  <button
                    type="button"
                    onClick={onCopy}
                    className="mt-2 flex w-full items-center justify-center gap-2 border border-bunker-tan px-3 py-2 text-xs font-bold uppercase tracking-wider text-bunker-tan"
                  >
                    <Clipboard className="h-4 w-4" /> {copied ? "Código copiado" : "Copiar código"}
                  </button>
                </>
              )}
              {pix.ticketUrl && (
                <a
                  href={pix.ticketUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-bunker-tan underline underline-offset-4"
                >
                  Abrir instruções Pix <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardPaymentBrick({
  amount,
  email,
  disabled,
  onFatal,
  onReady,
  onSubmit,
  loadSdk,
}: {
  amount: number;
  email: string;
  disabled: boolean;
  onFatal: (error: unknown) => void;
  onReady: () => void;
  onSubmit: (formData: unknown) => Promise<void>;
  loadSdk?: MercadoPagoSdkLoader;
}) {
  const rawId = useId();
  const containerId = `mercado-pago-card-${rawId.replace(/[^A-Za-z0-9_-]/g, "")}`;
  const callbacks = useRef({ onFatal, onReady, onSubmit });
  callbacks.current = { onFatal, onReady, onSubmit };

  useEffect(() => {
    if (disabled) return;
    const publicKey = getMercadoPagoPublicKey();
    if (!publicKey) {
      callbacks.current.onFatal(
        new PaymentContractError(
          "O cartão está indisponível porque VITE_MERCADO_PAGO_PUBLIC_KEY não foi configurada no ambiente de build.",
        ),
      );
      return;
    }

    let active = true;
    const submitLifecycle = createCardSubmitLifecycle();
    void mountCardPaymentBrick({
      publicKey,
      containerId,
      amount,
      email,
      loadSdk,
      onReady: () => active && callbacks.current.onReady(),
      onSubmit: (formData) => submitLifecycle.runSubmit(() => callbacks.current.onSubmit(formData)),
      onError: () =>
        active &&
        callbacks.current.onFatal(
          new PaymentContractError("O formulário seguro de cartão reportou uma falha."),
        ),
    })
      .then((mountedController) => {
        submitLifecycle.setController(mountedController);
        if (!active) submitLifecycle.requestUnmount();
      })
      .catch((error) => active && callbacks.current.onFatal(error));

    return () => {
      active = false;
      submitLifecycle.requestUnmount();
    };
  }, [amount, containerId, disabled, email, loadSdk]);

  return (
    <div className="mt-5 border border-bunker-graphite bg-bunker-black p-4">
      <div id={containerId} aria-label="Formulário seguro de cartão do Mercado Pago" />
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-bunker-text-secondary">
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bunker-military-light" />
        Seus dados do cartão são processados com segurança pelo Mercado Pago.
      </p>
    </div>
  );
}

function ThreeDSPanel({
  challenge,
  onCheck,
}: {
  challenge: ThreeDSChallenge;
  onCheck: () => void;
}) {
  const rawId = useId();
  const frameName = `mercado-pago-3ds-${rawId.replace(/[^A-Za-z0-9_-]/g, "")}`;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const startChallenge = () => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument?.body) {
      setLaunchError("Não foi possível preparar a janela segura. Tente novamente.");
      return;
    }
    // The navigation must originate in the iframe document: forms do not support
    // referrerPolicy, while this document's meta policy applies to its POST navigation.
    const meta = frameDocument.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    frameDocument.head.append(meta);
    const form = frameDocument.createElement("form");
    const continuation = frameDocument.createElement("input");
    form.method = "post";
    form.action = challenge.externalResourceUrl;
    continuation.type = "hidden";
    continuation.name = "creq";
    continuation.value = challenge.creq;
    form.append(continuation);
    frameDocument.body.append(form);
    form.submit();
    continuation.value = "";
    form.remove();
    setLaunchError(null);
    setStarted(true);
  };

  return (
    <section
      className="mt-5 border border-bunker-tan/60 bg-bunker-black p-4"
      aria-label="Verificação 3DS"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-bunker-tan">
        Verificação do emissor
      </p>
      <p className="mt-2 text-sm text-bunker-text-secondary">
        O desafio será enviado diretamente para <strong>{challenge.hostname}</strong>. A janela não
        confirma o pagamento; aguarde a confirmação do resultado após concluir a verificação.
      </p>
      <button
        type="button"
        onClick={startChallenge}
        disabled={started}
        className="mt-3 w-full bg-bunker-tan px-4 py-3 text-xs font-bold uppercase tracking-wider text-bunker-black disabled:opacity-50"
      >
        {started ? "Verificação iniciada" : "Iniciar verificação segura"}
      </button>
      <iframe
        ref={frameRef}
        name={frameName}
        title={`Verificação 3DS em ${challenge.hostname}`}
        sandbox="allow-forms allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={
          '<!doctype html><html><head><meta name="referrer" content="no-referrer"></head><body></body></html>'
        }
        className="mt-4 h-[430px] w-full border border-bunker-graphite bg-white"
      />
      {launchError && (
        <p className="mt-2 text-xs text-bunker-danger" role="alert">
          {launchError}
        </p>
      )}
      <button
        type="button"
        onClick={onCheck}
        disabled={!started}
        className="mt-3 w-full border border-bunker-tan px-4 py-3 text-xs font-bold uppercase tracking-wider text-bunker-tan disabled:opacity-50"
      >
        Concluí no emissor — consultar pagamento
      </button>
    </section>
  );
}
