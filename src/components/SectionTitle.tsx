import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}

export function SectionTitle({ title, subtitle, align = "left", className, action }: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 mb-6 md:mb-8",
        align === "center" && "justify-center text-center",
        className,
      )}
    >
      <div className={cn(align === "left" && "border-l-2 border-bunker-tan pl-4")}>
        <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wider text-bunker-text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="text-bunker-text-secondary mt-1 text-sm md:text-base">{subtitle}</p>
        )}
      </div>
      {action && <div className="hidden md:block">{action}</div>}
    </div>
  );
}
