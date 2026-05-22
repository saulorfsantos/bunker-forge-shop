import { Link } from "@tanstack/react-router";
import { Crosshair, Target, Shield, Swords, Tent, type LucideIcon } from "lucide-react";
import type { Category } from "@/types/product";

const iconMap: Record<string, LucideIcon> = {
  Crosshair,
  Target,
  Shield,
  Swords,
  Tent,
};

export function CategoryCard({ category }: { category: Category }) {
  const Icon = iconMap[category.icon] ?? Crosshair;
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group flex flex-col items-center justify-center gap-3 aspect-square bg-bunker-military border border-bunker-military-light rounded-sm p-4 hover:bg-bunker-tan hover:border-bunker-tan-dark transition-all"
    >
      <Icon className="w-10 h-10 md:w-14 md:h-14 text-bunker-tan group-hover:text-bunker-military group-hover:scale-110 transition-all" strokeWidth={1.5} />
      <span className="font-display uppercase tracking-wider text-bunker-tan group-hover:text-bunker-military text-sm md:text-lg text-center transition-colors">
        {category.name}
      </span>
    </Link>
  );
}

