import { PaymentContractError } from "./mercado-pago-contract.ts";

const MERCADO_PAGO_SDK_URL = "https://sdk.mercadopago.com/js/v2";
const SDK_SCRIPT_ATTRIBUTE = "data-bunker-mercado-pago-sdk";

export interface CardBrickController {
  unmount: () => Promise<void> | void;
}

interface MercadoPagoInstance {
  bricks: () => {
    create: (
      type: "cardPayment",
      containerId: string,
      settings: {
        initialization: { amount: number; payer: { email: string } };
        callbacks: {
          onReady: () => void;
          onSubmit: (formData: unknown) => Promise<void>;
          onError: () => void;
        };
      },
    ) => Promise<CardBrickController>;
  };
}

export type MercadoPagoConstructor = new (
  publicKey: string,
  options: { locale: "pt-BR" },
) => MercadoPagoInstance;

export type MercadoPagoSdkLoader = () => Promise<MercadoPagoConstructor>;

export function createCardSubmitLifecycle() {
  let controller: CardBrickController | undefined;
  let pendingSubmits = 0;
  let unmountRequested = false;
  let unmounted = false;

  const unmount = async () => {
    if (!controller || unmounted) return;
    unmounted = true;
    try {
      await controller.unmount();
    } catch {
      // Cleanup failures must not change the result of an already-settled card submit.
    }
  };

  return {
    setController(nextController: CardBrickController) {
      controller = nextController;
      if (unmountRequested && pendingSubmits === 0) void unmount();
    },
    async runSubmit<T>(submit: () => Promise<T>): Promise<T> {
      pendingSubmits += 1;
      try {
        return await submit();
      } finally {
        pendingSubmits -= 1;
        if (unmountRequested && pendingSubmits === 0) await unmount();
      }
    },
    requestUnmount() {
      unmountRequested = true;
      if (pendingSubmits === 0) void unmount();
    },
  };
}

function readMercadoPagoConstructor(): MercadoPagoConstructor | null {
  const candidate = (globalThis as typeof globalThis & { MercadoPago?: unknown }).MercadoPago;
  return typeof candidate === "function" ? (candidate as MercadoPagoConstructor) : null;
}

export function getMercadoPagoPublicKey(): string | null {
  const value = import.meta.env?.VITE_MERCADO_PAGO_PUBLIC_KEY;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function loadMercadoPagoSdk(): Promise<MercadoPagoConstructor> {
  const existing = readMercadoPagoConstructor();
  if (existing) return existing;
  if (typeof document === "undefined") {
    throw new PaymentContractError("MercadoPago.js só pode ser inicializado no navegador.");
  }

  let script = document.querySelector<HTMLScriptElement>(`script[${SDK_SCRIPT_ATTRIBUTE}]`);
  if (!script) {
    script = document.createElement("script");
    script.src = MERCADO_PAGO_SDK_URL;
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.setAttribute(SDK_SCRIPT_ATTRIBUTE, "true");
    document.head.append(script);
  }

  await new Promise<void>((resolve, reject) => {
    if (readMercadoPagoConstructor()) {
      resolve();
      return;
    }
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new PaymentContractError("Não foi possível carregar o componente seguro de cartão."));
    };
    const cleanup = () => {
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
    script?.addEventListener("load", onLoad, { once: true });
    script?.addEventListener("error", onError, { once: true });
  });

  const Constructor = readMercadoPagoConstructor();
  if (!Constructor) {
    throw new PaymentContractError("MercadoPago.js não disponibilizou o componente de cartão.");
  }
  return Constructor;
}

export async function mountCardPaymentBrick(options: {
  publicKey: string;
  containerId: string;
  amount: number;
  email: string;
  onReady: () => void;
  onSubmit: (formData: unknown) => Promise<void>;
  onError: () => void;
  loadSdk?: MercadoPagoSdkLoader;
}): Promise<CardBrickController> {
  if (!options.publicKey.trim()) {
    throw new PaymentContractError("A chave pública do Mercado Pago não está configurada.");
  }
  if (!Number.isFinite(options.amount) || options.amount <= 0) {
    throw new PaymentContractError("O total do carrinho não está disponível para o cartão.");
  }
  if (!options.containerId) {
    throw new PaymentContractError("O destino seguro do formulário de cartão está ausente.");
  }
  const Constructor = await (options.loadSdk ?? loadMercadoPagoSdk)();
  const mercadoPago = new Constructor(options.publicKey, { locale: "pt-BR" });
  return mercadoPago.bricks().create("cardPayment", options.containerId, {
    initialization: {
      amount: options.amount,
      payer: { email: options.email },
    },
    callbacks: {
      onReady: options.onReady,
      onSubmit: options.onSubmit,
      onError: options.onError,
    },
  });
}
