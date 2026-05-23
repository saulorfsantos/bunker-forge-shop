import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { cn } from "@/lib/utils";

interface ProductCarouselProps {
  products: Product[];
  id?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  skeletonCount?: number;
}

export function ProductCarousel({
  products,
  id,
  isLoading = false,
  isError = false,
  onRetry,
  skeletonCount = 4,
}: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [products.length, isLoading]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (isError) {
    return (
      <div
        className="rounded-sm border border-bunker-graphite bg-bunker-charcoal p-8 text-center"
        id={id}
      >
        <p className="text-bunker-text-secondary text-sm">
          Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-xs px-5 py-2 rounded-sm hover:bg-bunker-tan/10 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  const items = isLoading
    ? Array.from({ length: skeletonCount }, (_, index) => (
        <div
          key={`skeleton-${index}`}
          className="snap-start shrink-0 w-[80%] sm:w-[48%] md:w-[32%] lg:w-[24%]"
        >
          <ProductCardSkeleton />
        </div>
      ))
    : products.map((p) => (
        <div
          key={p.id}
          className="snap-start shrink-0 w-[80%] sm:w-[48%] md:w-[32%] lg:w-[24%]"
        >
          <ProductCard product={p} />
        </div>
      ));

  return (
    <div className="relative" id={id}>
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items}
      </div>

      {!isLoading && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollBy(-1)}
            disabled={!canLeft}
            className={cn(
              "hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 items-center justify-center w-11 h-11 rounded-sm bg-bunker-charcoal border border-bunker-graphite text-bunker-tan hover:border-bunker-tan transition-all z-10",
              !canLeft && "opacity-30 cursor-not-allowed",
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollBy(1)}
            disabled={!canRight}
            className={cn(
              "hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 items-center justify-center w-11 h-11 rounded-sm bg-bunker-charcoal border border-bunker-graphite text-bunker-tan hover:border-bunker-tan transition-all z-10",
              !canRight && "opacity-30 cursor-not-allowed",
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
