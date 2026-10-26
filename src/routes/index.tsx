import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { SectionTitle } from "@/components/SectionTitle";
import { ProductCarousel } from "@/components/ProductCarousel";
import { CategoryCard } from "@/components/CategoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroCarousel } from "@/components/HeroCarousel";
import {
  useCategories,
  useCategoryTree,
  useProductsByCategory,
  useProductsByCollection,
} from "@/hooks/useMedusaProducts";
import { categoryIdsByHandle } from "@/lib/category-hierarchy";
import { HERO_SLIDES } from "@/data/hero-slides";
import bunkerBg from "@/assets/background-header.jpg";

// Adriano picks the showcase in the Medusa panel through a collection whose handle starts with
// this ("destaque", "destaques"...); while it is missing or empty, the showcase falls back to the
// categories below. Collections never show in the menu, which only lists categories.
const FEATURED_COLLECTION_HANDLE = "destaque";
// Old handles stay listed so the showcases keep working until the menu migration is applied.
const FEATURED_HANDLES = ["armas-airsoft", "airguns-carabinas", "airsoft", "pressao"];
const GEAR_HANDLES = ["loadout", "acessorios"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bunker 81 Airsoft — Onde a missão começa" },
      {
        name: "description",
        content:
          "Loja brasileira de Airsoft, armas de pressão e equipamentos táticos. Rifles, pistolas, coletes, óticas e gear para operadores sérios.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const treeQuery = useCategoryTree();
  const categoriesQuery = useCategories();
  const featuredIds = useMemo(
    () => categoryIdsByHandle(treeQuery.data ?? [], FEATURED_HANDLES),
    [treeQuery.data],
  );
  const gearIds = useMemo(
    () => categoryIdsByHandle(treeQuery.data ?? [], GEAR_HANDLES),
    [treeQuery.data],
  );
  const featuredCollectionQuery = useProductsByCollection(FEATURED_COLLECTION_HANDLE, 8);
  const featuredCategoryQuery = useProductsByCategory(featuredIds, 8);
  const showCollection = Boolean(featuredCollectionQuery.data?.length);
  const featuredQuery = showCollection ? featuredCollectionQuery : featuredCategoryQuery;
  const gearQuery = useProductsByCategory(gearIds, 8);

  return (
    <Layout>
      {/* HERO */}
      <HeroCarousel slides={HERO_SLIDES} />

      {/* CARROSSEL 1 */}
      <section id="catalogo" className="bg-bunker-black border-t border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 py-14">
          <SectionTitle
            title="Arsenal em Destaque"
            subtitle="Seleção especial da Bunker 81"
          />
          <ProductCarousel
            products={featuredQuery.data ?? []}
            isLoading={
              featuredCollectionQuery.isLoading ||
              (!showCollection && (treeQuery.isLoading || featuredQuery.isLoading))
            }
            isError={!showCollection && (treeQuery.isError || featuredQuery.isError)}
            onRetry={() => void (treeQuery.isError ? treeQuery.refetch() : featuredQuery.refetch())}
            skeletonCount={4}
          />
        </div>
      </section>

      {/* SEÇÃO DE QUEBRA */}
      <section
        className="relative w-full h-[350px] md:h-[500px] flex items-end"
        style={{
          backgroundImage: `url(${bunkerBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 pb-10 md:pb-16 w-full">
          <p
            className="font-display uppercase tracking-wider text-bunker-text-primary text-2xl md:text-3xl lg:text-4xl max-w-2xl leading-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}
          >
            Prepare-se para o combate. Não aceite menos no seu loadout.
          </p>
        </div>
      </section>

      {/* CARROSSEL 2 */}
      <section className="bg-bunker-black">
        <div className="max-w-[1400px] mx-auto px-4 py-14">
          <SectionTitle
            title="Gear & Vestuário Tático"
            subtitle="Acessórios, coletes e equipamentos disponíveis no catálogo"
          />
          <ProductCarousel
            products={gearQuery.data ?? []}
            isLoading={treeQuery.isLoading || gearQuery.isLoading}
            isError={treeQuery.isError || gearQuery.isError}
            onRetry={() => void (treeQuery.isError ? treeQuery.refetch() : gearQuery.refetch())}
            skeletonCount={4}
          />
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="bg-bunker-charcoal border-t border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 py-14">
          <SectionTitle title="Operações por Categoria" subtitle="Escolha sua linha de combate" />
          {categoriesQuery.isError ? (
            <div className="rounded-sm border border-bunker-graphite bg-bunker-black p-8 text-center">
              <p className="text-bunker-text-secondary text-sm">
                Não foi possível carregar as categorias.
              </p>
              <button
                type="button"
                onClick={() => void categoriesQuery.refetch()}
                className="mt-4 inline-flex items-center justify-center border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-xs px-5 py-2 rounded-sm hover:bg-bunker-tan/10 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {categoriesQuery.isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <Skeleton
                      key={`category-skeleton-${index}`}
                      className="aspect-square rounded-sm bg-bunker-graphite-light/60"
                    />
                  ))
                : (categoriesQuery.data ?? []).map((category) => (
                    <CategoryCard key={category.slug} category={category} />
                  ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
