import { formatBRL } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
  showInstallments?: boolean;
  className?: string;
}

export function PriceTag({
  price,
  originalPrice,
  size = "md",
  showInstallments = true,
  className,
}: PriceTagProps) {
  const showOriginal = originalPrice && originalPrice > price;
  const installment = price / 10;

  const priceClass = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl md:text-4xl",
  }[size];

  return (
    <div className={cn("flex flex-col", className)}>
      {showOriginal && (
        <span className="text-bunker-text-secondary text-xs line-through tabular-nums">
          {formatBRL(originalPrice!)}
        </span>
      )}
      <span className={cn("price-tag leading-none", priceClass)}>{formatBRL(price)}</span>
      {showInstallments && (
        <span className="text-bunker-text-secondary text-[11px] md:text-xs mt-1">
          ou 10x de <span className="tabular-nums">{formatBRL(installment)}</span> sem juros
        </span>
      )}
    </div>
  );
}
