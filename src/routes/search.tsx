import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { SectionTitle } from "@/components/SectionTitle";
import { searchProducts } from "@/data/mockData";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({
    q: z.string().default("").catch(""),
  }),
  head: ({ match }) => ({
    meta: [
      { title: `Busca: ${match.search.q || "—"} — Bunker 81 Airsoft` },
      { name: "description", content: "Resultados da busca na Bunker 81 Airsoft." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const results = q ? searchProducts(q) : [];

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
        <SectionTitle
          title={q ? `Busca: "${q}"` : "Busca"}
          subtitle={q ? `${results.length} ${results.length === 1 ? "resultado encontrado" : "resultados encontrados"}` : "Digite um termo na barra de busca."}
        />

        {q && results.length === 0 && (
          <div className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-10 text-center">
            <Search className="w-10 h-10 mx-auto text-bunker-tan mb-3" />
            <p className="text-bunker-text-primary font-semibold">Nenhum produto encontrado para "{q}".</p>
            <p className="text-bunker-text-secondary text-sm mt-2">Tente outros termos ou explore por categoria.</p>
            <Link
              to="/"
              className="inline-block mt-5 border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-xs px-5 py-2 rounded-sm hover:bg-bunker-tan/10 transition-colors"
            >
              Voltar ao QG
            </Link>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
