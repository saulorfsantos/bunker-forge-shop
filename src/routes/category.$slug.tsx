import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductsByCategory } from "@/hooks/useMedusaProducts";
import { sdk } from "@/lib/medusa";
import type { Category, Product } from "@/types/product";
import { cn } from "@/lib/utils";

type MedusaCategoryByHandle = {
  id: string;
  name: string;
  handle: string;
};

function useCategoryByHandle(slug: string) {
  return useQuery({
    queryKey: ["medusa", "categories", "handle", slug] as const,
    queryFn: async () => {
      const { product_categories } = await sdk.store.category.list({
        handle: slug,
        fields: "id,name,handle",
      });

      return (product_categories[0] as MedusaCategoryByHandle | undefined) ?? null;
    },
    enabled: Boolean(slug),
  });
}

export const Route = createFileRoute("/category/$slug")({
  head: () => ({
    meta: [
      { title: "Categoria — Bunker 81 Airsoft" },
      {
        name: "description",
        content: "Confira nossa linha de produtos na Bunker 81 Airsoft. Equipamentos táticos com os melhores preços.",
      },
    ],
  }),
  component: CategoryPage,
});

type SortKey = "relevance" | "price-asc" | "price-desc" | "newest";

function CategoryPage() {
  const { slug } = Route.useParams();
  const categoryQuery = useCategoryByHandle(slug);
  const categoryId = categoryQuery.data?.id;
  const productsQuery = useProductsByCategory(categoryId ?? "", 100);
  const allProducts = productsQuery.data ?? [];

  const brands = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.brand))).sort(),
    [allProducts],
  );
  const maxPrice = useMemo(
    () => Math.max(1000, ...allProducts.map((p) => p.currentPrice)),
    [allProducts],
  );

  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(maxPrice);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [openFilters, setOpenFilters] = useState(false);

  const filtered = useMemo(() => {
    let res: Product[] = allProducts.filter((p) => {
      if (selectedSubs.length && !selectedSubs.includes(p.subcategory)) return false;
      if (selectedBrands.length && !selectedBrands.includes(p.brand)) return false;
      if (p.currentPrice < priceMin || p.currentPrice > priceMax) return false;
      if (inStockOnly && p.stock <= 0) return false;
      return true;
    });
    res = [...res];
    if (sort === "price-asc") res.sort((a, b) => a.currentPrice - b.currentPrice);
    else if (sort === "price-desc") res.sort((a, b) => b.currentPrice - a.currentPrice);
    else if (sort === "newest") res.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return res;
  }, [allProducts, selectedSubs, selectedBrands, priceMin, priceMax, inStockOnly, sort]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const clearAll = () => {
    setSelectedSubs([]);
    setSelectedBrands([]);
    setPriceMin(0);
    setPriceMax(maxPrice);
    setInStockOnly(false);
  };

  const isLoading = categoryQuery.isLoading || productsQuery.isLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">
          <Skeleton className="h-4 w-48 mb-4 bg-bunker-graphite/60" />
          <Skeleton className="h-12 w-64 mb-6 bg-bunker-graphite/60" />
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            <Skeleton className="hidden lg:block h-96 bg-bunker-graphite/60 rounded-sm" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`category-product-skeleton-${index}`} className="aspect-[3/4] bg-bunker-graphite/60 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (categoryQuery.isError || !categoryQuery.data) {
    throw notFound();
  }

  const category: Category = {
    slug: categoryQuery.data.handle,
    name: categoryQuery.data.name,
    icon: "Crosshair",
    subcategories: [],
  };

  const Filters = (
    <div className="space-y-6">
      <FilterBlock title="Subcategoria">
        {category.subcategories.map((s) => (
          <label key={s.slug} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSubs.includes(s.slug)}
              onChange={() => toggle(selectedSubs, setSelectedSubs, s.slug)}
              className="accent-bunker-tan"
            />
            <span className="text-bunker-text-primary">{s.name}</span>
          </label>
        ))}
      </FilterBlock>

      <FilterBlock title="Faixa de Preço">
        <div className="flex items-center gap-2 text-xs">
          <input
            type="number"
            value={priceMin}
            min={0}
            onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
            className="w-full bg-bunker-black border border-bunker-graphite rounded-sm px-2 py-1.5 text-bunker-text-primary focus:outline-none focus:border-bunker-tan"
            aria-label="Preço mínimo"
          />
          <span className="text-bunker-text-secondary">—</span>
          <input
            type="number"
            value={priceMax}
            min={0}
            onChange={(e) => setPriceMax(Number(e.target.value) || 0)}
            className="w-full bg-bunker-black border border-bunker-graphite rounded-sm px-2 py-1.5 text-bunker-text-primary focus:outline-none focus:border-bunker-tan"
            aria-label="Preço máximo"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="Marca">
        {brands.map((b) => (
          <label key={b} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedBrands.includes(b)}
              onChange={() => toggle(selectedBrands, setSelectedBrands, b)}
              className="accent-bunker-tan"
            />
            <span className="text-bunker-text-primary">{b}</span>
          </label>
        ))}
      </FilterBlock>

      <FilterBlock title="Disponibilidade">
        <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-bunker-tan"
          />
          <span className="text-bunker-text-primary">Apenas em estoque</span>
        </label>
      </FilterBlock>

      <button
        type="button"
        onClick={clearAll}
        className="w-full border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-xs py-2 rounded-sm hover:bg-bunker-tan/10 transition-colors"
      >
        Limpar Filtros
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-bunker-text-secondary mb-4">
          <Link to="/" className="hover:text-bunker-tan">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-bunker-tan uppercase tracking-wider">{category.name}</span>
        </nav>

        <div className="flex items-end justify-between gap-4 mb-6 border-l-2 border-bunker-tan pl-4">
          <div>
            <h1 className="font-display text-3xl md:text-5xl uppercase tracking-wider">
              {category.name}
            </h1>
            <p className="text-bunker-text-secondary text-sm mt-1">
              {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="lg:hidden flex items-center gap-2 border border-bunker-graphite text-bunker-text-primary px-3 py-2 rounded-sm text-xs uppercase font-bold tracking-wider hover:border-bunker-tan"
              onClick={() => setOpenFilters(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-bunker-charcoal border border-bunker-graphite text-bunker-text-primary rounded-sm px-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-bunker-tan"
              aria-label="Ordenar"
            >
              <option value="relevance">Mais relevantes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="newest">Mais novos</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block bg-bunker-charcoal border border-bunker-graphite rounded-sm p-5 self-start sticky top-44">
            {Filters}
          </aside>

          {/* Drawer mobile */}
          <div
            className={cn(
              "fixed inset-0 z-50 lg:hidden transition-opacity",
              openFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            )}
          >
            <div className="absolute inset-0 bg-bunker-black/80" onClick={() => setOpenFilters(false)} />
            <div
              className={cn(
                "absolute right-0 top-0 h-full w-[85%] max-w-sm bg-bunker-charcoal border-l border-bunker-graphite p-5 overflow-y-auto transition-transform",
                openFilters ? "translate-x-0" : "translate-x-full",
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display uppercase tracking-wider">Filtros</h3>
                <button onClick={() => setOpenFilters(false)} aria-label="Fechar">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {Filters}
            </div>
          </div>

          <div>
            {filtered.length === 0 ? (
              <div className="bg-bunker-charcoal border border-bunker-graphite p-10 rounded-sm text-center text-bunker-text-secondary">
                Nenhum produto encontrado com esses filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display uppercase tracking-wider text-bunker-tan text-sm mb-2 pb-2 border-b border-bunker-graphite">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}
