import { formatBRL } from "./money.ts";

interface QuotedOption {
  id: string;
  price_type?: string;
  amount?: number;
}

export async function loadCalculatedShippingPrices(
  cartId: string,
  options: QuotedOption[],
  calculate: (cartId: string, optionId: string) => Promise<number>,
  onQuote: (optionId: string, amount: number | null) => void,
): Promise<void> {
  await Promise.all(
    options
      .filter((option) => option.price_type === "calculated")
      .map(async (option) => {
        try {
          onQuote(option.id, await calculate(cartId, option.id));
        } catch {
          onQuote(option.id, null);
        }
      }),
  );
}

export function shippingOptionPriceLabel(
  option: QuotedOption,
  quotedPrice: number | null | undefined,
): string {
  if (option.price_type === "calculated") {
    if (typeof quotedPrice === "number" && Number.isFinite(quotedPrice)) {
      return formatBRL(quotedPrice);
    }
    return quotedPrice === null ? "Cotação indisponível" : "Calculando...";
  }
  return typeof option.amount === "number" && Number.isFinite(option.amount)
    ? formatBRL(option.amount)
    : "Preço indisponível";
}
