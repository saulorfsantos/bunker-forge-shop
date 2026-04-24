import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "danger" | "promo" | "new" | "tan" | "military";

interface BunkerBadgeProps {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

const styles: Record<Variant, string> = {
  danger: "bg-bunker-danger text-bunker-text-primary",
  promo: "bg-bunker-military text-bunker-text-primary",
  new: "bg-bunker-tan text-bunker-black",
  tan: "bg-bunker-tan text-bunker-black",
  military: "bg-bunker-military text-bunker-text-primary",
};

export function BunkerBadge({ variant, children, className }: BunkerBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wider",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
