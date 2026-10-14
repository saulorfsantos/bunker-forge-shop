export interface CouponCart {
  id: string;
  item_subtotal?: number;
  item_total?: number;
  item_discount_total?: number;
  items?: Array<{ unit_price?: number; quantity: number }>;
  promotions?: Array<{ code?: string; is_automatic?: boolean }>;
  payment_collection?: {
    status?: string;
    payment_sessions?: Array<{ status?: string }>;
  } | null;
}

function amount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function appliedCouponCodes(cart: CouponCart | null): string[] {
  return (cart?.promotions ?? [])
    .filter((promotion) => !promotion.is_automatic && promotion.code)
    .map((promotion) => promotion.code!);
}

export function cartItemAmounts(cart: CouponCart | null) {
  if (!cart || (cart.items ?? []).some((item) => !amount(item.unit_price))) {
    return { subtotal: null, discount: null, total: null };
  }
  const subtotal = amount(cart.item_subtotal)
    ? cart.item_subtotal
    : (cart.items ?? []).reduce((sum, item) => sum + item.unit_price! * item.quantity, 0);
  const discount = amount(cart.item_discount_total) ? cart.item_discount_total : null;
  // A promoção é calculada pelo servidor. Não aplicar percentuais no navegador.
  const total = amount(cart.item_total)
    ? cart.item_total
    : cart.promotions?.length
      ? null
      : subtotal;
  return { subtotal, discount, total };
}

export function assertCouponCanChange(cart: CouponCart): void {
  const collection = cart.payment_collection;
  if (
    ["authorized", "completed", "partially_authorized"].includes(collection?.status ?? "") ||
    collection?.payment_sessions?.some(
      (session) => !["canceled", "error"].includes(session.status ?? "pending"),
    )
  ) {
    throw new Error(
      "Este carrinho já tem um pagamento iniciado. Retome o pagamento ou esvazie o carrinho para iniciar uma nova compra com cupom.",
    );
  }
}

export interface CouponTransport {
  retrieve: (id: string) => Promise<CouponCart>;
  add: (id: string, code: string) => Promise<CouponCart>;
  remove: (id: string, code: string) => Promise<CouponCart>;
}

export async function changeCartCoupon(
  transport: CouponTransport,
  cartId: string,
  input: string,
  action: "add" | "remove",
): Promise<CouponCart> {
  const code = input.trim().toUpperCase();
  if (!code || code.length > 100) throw new Error("Informe um código de cupom válido.");
  const before = await transport.retrieve(cartId);
  if (before.id !== cartId) throw new Error("Não foi possível confirmar o carrinho.");
  assertCouponCanChange(before);
  const cart = await transport[action](cartId, code);
  if (cart.id !== cartId) throw new Error("Não foi possível confirmar o carrinho atualizado.");
  if (action === "add" && !appliedCouponCodes(cart).some((value) => value.toUpperCase() === code)) {
    throw new Error(
      "O cupom não está válido para estes itens ou sua validade/limite de uso terminou.",
    );
  }
  return cart;
}
