const PAYMENT_OPTION_LABELS: Record<string, string> = {
  pp_system_default: "Pagamento a combinar",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pedido pendente",
  completed: "Pedido registrado",
  draft: "Pedido em preparação",
  archived: "Pedido arquivado",
  canceled: "Pedido cancelado",
  cancelled: "Pedido cancelado",
  requires_action: "Aguardando ação",
  confirmed: "Pedido registrado",
  processing: "Pedido em preparação",
  shipped: "Pedido enviado",
  delivered: "Pedido entregue",
  refunded: "Reembolsado",
  failed: "Pedido não concluído",
};

export function getPaymentOptionLabel(paymentOptionId: string): string {
  return PAYMENT_OPTION_LABELS[paymentOptionId] ?? "Pagamento a combinar";
}

export function getOrderStatusLabel(status?: string): string {
  if (!status) return "Status indisponível";
  return ORDER_STATUS_LABELS[status.trim().toLowerCase()] ?? "Status indisponível";
}

export function getOrderDisplayLabel(displayId?: number): string {
  return typeof displayId === "number" ? `#${displayId}` : "Identificação indisponível";
}
