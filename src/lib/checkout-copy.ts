const PAYMENT_OPTION_LABELS: Record<string, string> = {
  pp_system_default: "Pagamento",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluído",
  draft: "Em preparação",
  archived: "Arquivado",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  requires_action: "Aguardando ação",
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  delivered: "Entregue",
  refunded: "Reembolsado",
  failed: "Não concluído",
};

export function getPaymentOptionLabel(paymentOptionId: string): string {
  return PAYMENT_OPTION_LABELS[paymentOptionId] ?? "Forma de pagamento";
}

export function getOrderStatusLabel(status?: string): string {
  if (!status) return "Pendente";
  return ORDER_STATUS_LABELS[status.trim().toLowerCase()] ?? "Em processamento";
}
