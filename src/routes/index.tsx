import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { SectionTitle } from "@/components/SectionTitle";
import { ProductCarousel } from "@/components/ProductCarousel";
import { CategoryCard } from "@/components/CategoryCard";
import {
  categories,
  getFeaturedProducts,
  getGearProducts,
} from "@/data/mockData";
import heroBg from "@/assets/hero-bg.jpg";
import bunkerBg from "@/assets/background-header.jpg";


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
  const featured = getFeaturedProducts();
  const gear = getGearProducts();

  return (
    <Layout>
      {/* HERO */}
      <section
        className="relative min-h-[80vh] flex items-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.2) 100%), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl">
            <p
              className="text-bunker-military-light font-display uppercase tracking-widest text-2xl sm:text-3xl md:text-4xl mb-6"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}
            >
              Bunker 81 — Onde a missão começa
            </p>
            <h1 className="font-display uppercase text-bunker-text-primary text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-wider">
              Equipamento <span className="text-bunker-tan">tático</span> de alta performance
            </h1>
            <p className="mt-5 text-base md:text-lg text-bunker-text-secondary max-w-xl">
              Arsenal completo para operadores sérios. Airsoft, armas de pressão e gear tático de verdade.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/category/$slug"
                params={{ slug: "airsoft" }}
                className="inline-flex items-center justify-center bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-sm px-6 py-3 rounded-sm hover:bg-bunker-tan-dark transition-colors"
              >
                Ver Equipamentos
              </Link>
              <a
                href="#ofertas"
                className="inline-flex items-center justify-center border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-sm px-6 py-3 rounded-sm hover:bg-bunker-tan/10 transition-colors"
              >
                Ver Ofertas
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* CARROSSEL 1 */}
      <section id="ofertas" className="bg-bunker-black border-t border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 py-14">
          <SectionTitle
            title="Arsenal em Destaque"
            subtitle="Rifles e pistolas selecionados com os melhores preços"
          />
          <ProductCarousel products={featured} />
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
            subtitle="Acessórios, coletes e equipamentos para operações reais"
          />
          <ProductCarousel products={gear} />
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="bg-bunker-charcoal border-t border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 py-14">
          <SectionTitle title="Operações por Categoria" subtitle="Escolha sua linha de combate" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {categories.map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
