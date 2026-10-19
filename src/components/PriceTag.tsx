import { formatBRL } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  size?: "sm" | "md" | "lg";
  prefix?: string;
  className?: string;
}

export function PriceTag({ price, originalPrice, size = "md", prefix, className }: PriceTagProps) {
  const showOriginal = originalPrice && originalPrice > price;

  const priceClass = {
    sm: "text-base",
    md: "text-[1.375rem]",
    lg: "text-3xl md:text-4xl",
  }[size];

  return (
    <div className={cn("flex flex-col", className)}>
      {prefix && (
        <span className="text-bunker-text-secondary text-xs uppercase tracking-wider mb-1">
          {prefix}
        </span>
      )}
      {showOriginal && (
        <span className="text-bunker-text-secondary text-[13px] line-through tabular-nums">
          {formatBRL(originalPrice!)}
        </span>
      )}
      <span className={cn("price-tag leading-none", priceClass)}>{formatBRL(price)}</span>
    </div>
  );
}
