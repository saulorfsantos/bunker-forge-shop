import { PaymentApiError } from "./mercado-pago-api.ts";
import {
  MERCADO_PAGO_PIX_PROVIDER_ID,
  PaymentContractError,
  PaymentSessionRecoveryError,
  type MercadoPagoMethod,
  type MercadoPagoProviderId,
} from "./mercado-pago-contract.ts";

export type PaymentErrorContext = "preflight" | "active-session";
export type PaymentErrorSeverity = "fatal" | "recoverable";
export type PaymentPollingIntent = "monitor-pending" | "recover-session" | "post-challenge";

export function classifyPaymentError(
  error: unknown,
  context: PaymentErrorContext,
): PaymentErrorSeverity {
  if (error instanceof PaymentSessionRecoveryError) return "recoverable";
  if (error instanceof PaymentApiError) return error.recoverable ? "recoverable" : "fatal";
  if (error instanceof PaymentContractError) {
    return context === "active-session" ? "recoverable" : "fatal";
  }
  if (context === "active-session") return "recoverable";
  return "recoverable";
}

export function challengeBehaviorForIntent(intent: PaymentPollingIntent): "return" | "continue" {
  return intent === "post-challenge" ? "continue" : "return";
}

export function requiresPixSwitchConfirmation(options: {
  currentMethod: MercadoPagoMethod;
  nextMethod: MercadoPagoMethod;
  activeProviderId: MercadoPagoProviderId | null;
}): boolean {
  return (
    options.currentMethod === "pix" &&
    options.nextMethod === "card" &&
    options.activeProviderId === MERCADO_PAGO_PIX_PROVIDER_ID
  );
}

export function confirmPaymentMethodSwitch(
  options: Parameters<typeof requiresPixSwitchConfirmation>[0],
  confirmAbandonment: () => boolean,
): boolean {
  return !requiresPixSwitchConfirmation(options) || confirmAbandonment();
}
