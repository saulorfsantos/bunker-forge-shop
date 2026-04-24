import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/types/product";
import { BunkerBadge } from "./BunkerBadge";
import { PriceTag } from "./PriceTag";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const fav = isFavorite(product.id);

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-bunker-charcoal border border-bunker-graphite rounded-sm overflow-hidden transition-all hover:border-bunker-tan hover:-translate-y-0.5 hover:shadow-lg hover:shadow-bunker-black/50",
        className,
      )}
    >
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative aspect-square bg-bunker-black overflow-hidden block"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
        />

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discountPercent >= 10 && (
            <BunkerBadge variant="danger">-{product.discountPercent}%</BunkerBadge>
          )}
          {product.isPromo && <BunkerBadge variant="promo">Promo</BunkerBadge>}
          {product.isNew && <BunkerBadge variant="new">Novo</BunkerBadge>}
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(product.id);
        }}
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-sm bg-bunker-black/70 hover:bg-bunker-black border border-bunker-graphite hover:border-bunker-tan transition-colors"
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-colors",
            fav ? "fill-bunker-tan text-bunker-tan" : "text-bunker-text-primary",
          )}
        />
      </button>

      <div className="flex flex-col flex-1 p-3 md:p-4 gap-2">
        <p className="text-[10px] uppercase text-bunker-text-secondary tracking-wider">
          {product.brand}
        </p>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="text-bunker-text-primary text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem] hover:text-bunker-tan transition-colors"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2">
          <PriceTag
            price={product.currentPrice}
            originalPrice={product.discountPercent > 0 ? product.price1 : undefined}
            size="md"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            addItem(product.id, 1);
            toast.success("Adicionado ao carrinho", { description: product.name });
          }}
          className="mt-2 w-full bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-xs py-2.5 rounded-sm hover:bg-bunker-tan-dark transition-colors"
        >
          Comprar
        </button>
      </div>
    </article>
  );
}
