import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from "lucide-react";
import logoShield from "@/assets/logo-shield.png";
import { categories } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

export function Header() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: "/search", search: { q } });
    setOpenMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top bar */}
      <div className="bg-bunker-tan border-b border-bunker-tan-dark">
        <div className="max-w-[1400px] mx-auto px-4 h-9 flex items-center justify-center text-center text-[11px] font-semibold uppercase tracking-wider text-bunker-military">
          <span className="hidden sm:inline">
            Frete grátis acima de R$ 499 | Parcele em até 10x
          </span>
          <span className="sm:hidden">Frete grátis +R$ 499 | 10x</span>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-bunker-charcoal border-b border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <img src={logoShield} alt="Bunker 81 Airsoft" className="h-14 w-auto" />
            <span className="hidden lg:flex flex-col leading-none">
              <span className="font-display text-bunker-tan text-xl uppercase tracking-wider">Bunker 81</span>
              <span className="text-[10px] text-bunker-text-secondary uppercase tracking-widest">Onde a missão começa</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto hidden md:flex">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por rifles, coletes, lanternas..."
              className="flex-1 bg-bunker-black border border-bunker-graphite rounded-l-sm px-4 py-2.5 text-sm text-bunker-text-primary placeholder:text-bunker-text-secondary focus:outline-none focus:border-bunker-tan"
            />
            <button
              type="submit"
              className="bg-bunker-tan text-bunker-black px-5 rounded-r-sm hover:bg-bunker-tan-dark transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          <div className="flex items-center gap-1 md:gap-3 ml-auto">
            <button
              type="button"
              aria-label="Conta"
              className="hidden sm:flex p-2 text-bunker-text-primary hover:text-bunker-tan transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label={`Favoritos (${favorites.length})`}
              className="relative p-2 text-bunker-text-primary hover:text-bunker-tan transition-colors"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute top-0 right-0 bg-bunker-tan text-bunker-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>
            <Link
              to="/cart"
              aria-label={`Carrinho (${itemCount})`}
              className="relative p-2 text-bunker-text-primary hover:text-bunker-tan transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-bunker-tan text-bunker-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              aria-label="Menu"
              className="md:hidden p-2 text-bunker-text-primary"
            >
              {openMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 flex">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 bg-bunker-black border border-bunker-graphite rounded-l-sm px-3 py-2 text-sm text-bunker-text-primary placeholder:text-bunker-text-secondary focus:outline-none focus:border-bunker-tan"
          />
          <button type="submit" className="bg-bunker-tan text-bunker-black px-4 rounded-r-sm" aria-label="Buscar">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Category nav */}
      <nav className="bg-bunker-tan border-b border-bunker-tan-dark hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 h-12 flex items-center gap-1">
          {categories.map((cat) => (
            <div key={cat.slug} className="relative group h-full flex items-center">
              <Link
                to="/category/$slug"
                params={{ slug: cat.slug }}
                className="px-3 lg:px-4 py-2 font-display text-sm uppercase tracking-wider text-bunker-military hover:text-bunker-military-light transition-colors flex items-center gap-1"
              >
                {cat.name}
                <ChevronDown className="w-3 h-3" />
              </Link>
              <div className="absolute top-full left-0 min-w-[220px] bg-bunker-charcoal border border-bunker-graphite rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <ul className="py-2">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.slug}>
                      <Link
                        to="/category/$slug"
                        params={{ slug: cat.slug }}
                        className="block px-4 py-2 text-sm text-bunker-text-primary hover:bg-bunker-graphite hover:text-bunker-tan transition-colors"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden bg-bunker-graphite border-b border-bunker-black overflow-hidden transition-all",
          openMenu ? "max-h-[600px]" : "max-h-0",
        )}
      >
        <ul className="px-4 py-2">
          {categories.map((cat) => (
            <li key={cat.slug} className="border-b border-bunker-charcoal last:border-b-0">
              <Link
                to="/category/$slug"
                params={{ slug: cat.slug }}
                onClick={() => setOpenMenu(false)}
                className="block py-3 font-display uppercase tracking-wider text-bunker-text-primary hover:text-bunker-tan"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
