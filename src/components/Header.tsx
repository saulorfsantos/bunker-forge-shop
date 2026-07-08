import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown } from "lucide-react";
import logoShield from "@/assets/logo-shield.png";
import { useCategories, useSearchProducts } from "@/hooks/useMedusaProducts";
import { formatBRL } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;
const AUTOCOMPLETE_LIMIT = 6;

export function Header() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const { data: results = [], isLoading } = useSearchProducts(debouncedQuery, AUTOCOMPLETE_LIMIT);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setDropdownOpen(false);
    }
  }, [query]);

  const isDebouncing = Boolean(query.trim()) && query.trim() !== debouncedQuery;
  const isSearchLoading = isDebouncing || (Boolean(debouncedQuery) && isLoading);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setDropdownOpen(false);
    navigate({ to: "/search", search: { q } });
    setOpenMenu(false);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setDropdownOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Main bar */}
      <div className="bg-bunker-charcoal border-b border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 h-32 flex items-center gap-4">
          <Link to="/" className="shrink-0 flex items-center gap-3">
            <img src={logoShield} alt="Bunker 81 Airsoft" className="h-24 w-auto" />
            <span className="hidden lg:flex flex-col leading-none">
              <span className="font-display text-bunker-tan text-3xl uppercase tracking-wider">Bunker 81</span>
              <span className="text-xs text-bunker-text-secondary uppercase tracking-widest mt-1">Onde a missão começa</span>
            </span>
          </Link>

          <SearchFormWithSuggestions
            query={query}
            onQueryChange={handleQueryChange}
            onSubmit={handleSearch}
            onFocus={() => {
              if (query.trim()) setDropdownOpen(true);
            }}
            dropdownOpen={dropdownOpen}
            onCloseDropdown={() => setDropdownOpen(false)}
            results={results}
            isSearchLoading={isSearchLoading}
            containerClassName="flex-1 max-w-2xl mx-auto hidden md:block"
            formClassName="flex w-full"
            inputClassName="flex-1 bg-bunker-black border border-bunker-graphite rounded-l-sm px-4 py-2.5 text-sm text-bunker-text-primary placeholder:text-bunker-text-secondary focus:outline-none focus:border-bunker-tan"
            buttonClassName="bg-bunker-tan text-bunker-black px-5 rounded-r-sm hover:bg-bunker-tan-dark transition-colors"
            placeholder="Busque por rifles, coletes, lanternas..."
            iconClassName="w-5 h-5"
          />

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
        <SearchFormWithSuggestions
          query={query}
          onQueryChange={handleQueryChange}
          onSubmit={handleSearch}
          onFocus={() => {
            if (query.trim()) setDropdownOpen(true);
          }}
          dropdownOpen={dropdownOpen}
          onCloseDropdown={() => setDropdownOpen(false)}
          results={results}
          isSearchLoading={isSearchLoading}
          containerClassName="md:hidden px-4 pb-3"
          formClassName="flex w-full"
          inputClassName="flex-1 bg-bunker-black border border-bunker-graphite rounded-l-sm px-3 py-2 text-sm text-bunker-text-primary placeholder:text-bunker-text-secondary focus:outline-none focus:border-bunker-tan"
          buttonClassName="bg-bunker-tan text-bunker-black px-4 rounded-r-sm"
          placeholder="Buscar..."
          iconClassName="w-4 h-4"
        />
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
                  {(cat.subcategories ?? []).map((sub) => (
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

interface SearchFormWithSuggestionsProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFocus: () => void;
  dropdownOpen: boolean;
  onCloseDropdown: () => void;
  results: Product[];
  isSearchLoading: boolean;
  containerClassName: string;
  formClassName: string;
  inputClassName: string;
  buttonClassName: string;
  placeholder: string;
  iconClassName: string;
}

function SearchFormWithSuggestions({
  query,
  onQueryChange,
  onSubmit,
  onFocus,
  dropdownOpen,
  onCloseDropdown,
  results,
  isSearchLoading,
  containerClassName,
  formClassName,
  inputClassName,
  buttonClassName,
  placeholder,
  iconClassName,
}: SearchFormWithSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideAutocomplete = (target as Element).closest?.("[data-search-autocomplete]");

      if (containerRef.current?.contains(target) || insideAutocomplete) {
        return;
      }

      onCloseDropdown();
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, onCloseDropdown]);

  const showDropdown = dropdownOpen && Boolean(query.trim());

  return (
    <div ref={containerRef} data-search-autocomplete className={cn("relative", containerClassName)}>
      <form onSubmit={onSubmit} className={formClassName}>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className={inputClassName}
          autoComplete="off"
        />
        <button type="submit" className={buttonClassName} aria-label="Buscar">
          <Search className={iconClassName} />
        </button>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-bunker-charcoal border border-bunker-graphite rounded-sm shadow-xl overflow-hidden">
          {isSearchLoading ? (
            <p className="px-4 py-3 text-sm text-bunker-text-secondary">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-bunker-text-secondary">Nenhum produto encontrado</p>
          ) : (
            <ul>
              {results.slice(0, AUTOCOMPLETE_LIMIT).map((product) => (
                <li key={product.id}>
                  <Link
                    to="/product/$id"
                    params={{ id: product.id }}
                    onClick={onCloseDropdown}
                    className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-bunker-graphite transition-colors"
                  >
                    <img
                      src={product.images[0]}
                      alt=""
                      draggable={false}
                      className="w-10 h-10 shrink-0 rounded-sm object-cover bg-bunker-black border border-bunker-graphite pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-bunker-text-primary line-clamp-1">{product.name}</p>
                      <p className="text-xs text-bunker-tan tabular-nums mt-0.5">
                        {formatBRL(product.currentPrice)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
