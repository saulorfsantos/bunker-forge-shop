import { sdk } from "@/lib/medusa";

export interface CustomerOrderItem {
  id: string;
  title?: string | null;
  quantity: number;
  unit_price?: number | null;
  total?: number | null;
  thumbnail?: string | null;
}

export interface CustomerOrder {
  id: string;
  display_id?: number | null;
  status?: string | null;
  fulfillment_status?: string | null;
  payment_status?: string | null;
  currency_code?: string | null;
  total?: number | null;
  created_at?: string | null;
  items?: CustomerOrderItem[] | null;
}

const CUSTOMER_ORDER_FIELDS =
  "id,display_id,status,fulfillment_status,payment_status,currency_code,total,created_at,*items";

export async function listCustomerOrders(): Promise<CustomerOrder[]> {
  const { orders } = await sdk.store.order.list({
    fields: CUSTOMER_ORDER_FIELDS,
    limit: 100,
    order: "-created_at",
  });
  return orders as CustomerOrder[];
}

export async function retrieveCustomerOrder(orderId: string): Promise<CustomerOrder | null> {
  const { orders } = await sdk.store.order.list({
    id: orderId,
    fields: CUSTOMER_ORDER_FIELDS,
    limit: 1,
  });
  return (orders[0] as CustomerOrder | undefined) ?? null;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluído",
  canceled: "Cancelado",
  archived: "Arquivado",
  requires_action: "Ação necessária",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_paid: "Não pago",
  awaiting: "Aguardando pagamento",
  authorized: "Pagamento autorizado",
  partially_authorized: "Parcialmente autorizado",
  captured: "Pagamento confirmado",
  partially_captured: "Pagamento parcialmente confirmado",
  partially_refunded: "Reembolso parcial",
  refunded: "Reembolsado",
  canceled: "Pagamento cancelado",
  requires_action: "Ação de pagamento necessária",
};

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  not_fulfilled: "Separação pendente",
  partially_fulfilled: "Separação parcial",
  fulfilled: "Separado",
  partially_shipped: "Envio parcial",
  shipped: "Enviado",
  partially_delivered: "Entrega parcial",
  delivered: "Entregue",
  canceled: "Entrega cancelada",
};

function statusLabel(labels: Record<string, string>, status?: string | null): string {
  if (!status) return "Não informado";
  return labels[status] ?? "Em processamento";
}

export const getOrderStatusLabel = (status?: string | null) =>
  statusLabel(ORDER_STATUS_LABELS, status);
export const getPaymentStatusLabel = (status?: string | null) =>
  statusLabel(PAYMENT_STATUS_LABELS, status);
export const getFulfillmentStatusLabel = (status?: string | null) =>
  statusLabel(FULFILLMENT_STATUS_LABELS, status);

export function getCustomerOrderNumber(order: CustomerOrder): string {
  return typeof order.display_id === "number" ? `#${order.display_id}` : "Pedido";
}
