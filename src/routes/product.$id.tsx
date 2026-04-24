import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Minus, Plus, ShieldCheck, Package, Award, Star } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PriceTag } from "@/components/PriceTag";
import { BunkerBadge } from "@/components/BunkerBadge";
import { ProductCarousel } from "@/components/ProductCarousel";
import { SectionTitle } from "@/components/SectionTitle";
import {
  getCategoryBySlug,
  getProductById,
  getProductsByCategory,
  formatBRL,
} from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  beforeLoad: ({ params }) => {
    if (!getProductById(params.id)) throw notFound();
  },
  head: ({ params }) => {
    const p = getProductById(params.id);
    return {
      meta: [
        { title: p ? `${p.name} — Bunker 81 Airsoft` : "Produto" },
        { name: "description", content: p?.description.slice(0, 160) ?? "" },
      ],
    };
  },
  component: ProductPage,
});

type Tab = "desc" | "specs" | "reviews";

function ProductPage() {
  const { id } = Route.useParams();
  const product = getProductById(id)!;
  const category = getCategoryBySlug(product.category);
  const { addItem } = useCart();

  const [mainImage, setMainImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("desc");
  const [cep, setCep] = useState("");

  const related = useMemo(
    () => getProductsByCategory(product.category).filter((p) => p.id !== product.id).slice(0, 8),
    [product],
  );
  const pixPrice = product.currentPrice * 0.95;

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">
        <nav className="flex items-center gap-1 text-xs text-bunker-text-secondary mb-6 flex-wrap">
          <Link to="/" className="hover:text-bunker-tan">Home</Link>
          <ChevronRight className="w-3 h-3" />
          {category && (
            <>
              <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:text-bunker-tan uppercase tracking-wider">
                {category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-bunker-tan line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 lg:gap-10">
          {/* Gallery */}
          <div className="flex flex-col-reverse md:flex-row gap-3">
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMainImage(i)}
                  className={cn(
                    "shrink-0 w-16 h-16 md:w-20 md:h-20 bg-bunker-black border rounded-sm overflow-hidden transition-colors",
                    i === mainImage ? "border-bunker-tan" : "border-bunker-graphite hover:border-bunker-tan-dark",
                  )}
                  aria-label={`Imagem ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="relative flex-1 aspect-square bg-bunker-charcoal border border-bunker-graphite rounded-sm overflow-hidden">
              <img
                src={product.images[mainImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {product.discountPercent >= 10 && <BunkerBadge variant="danger">-{product.discountPercent}%</BunkerBadge>}
                {product.isPromo && <BunkerBadge variant="promo">Promo</BunkerBadge>}
                {product.isNew && <BunkerBadge variant="new">Novo</BunkerBadge>}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest text-bunker-text-secondary">
              {product.brand} · SKU {product.sku}
            </p>
            <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wider leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-4 h-4",
                      s <= Math.round(product.rating)
                        ? "fill-bunker-tan text-bunker-tan"
                        : "text-bunker-graphite",
                    )}
                  />
                ))}
              </div>
              <span className="text-bunker-text-secondary">
                {product.rating.toFixed(1)} ({product.reviewsCount} avaliações)
              </span>
            </div>

            <div className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-5 mt-2">
              <PriceTag
                price={product.currentPrice}
                originalPrice={product.discountPercent > 0 ? product.price1 : undefined}
                size="lg"
                showInstallments={false}
              />
              <p className="mt-2 text-bunker-military-light text-sm font-semibold">
                {formatBRL(pixPrice)} à vista no PIX (5% OFF)
              </p>
              <p className="text-bunker-text-secondary text-sm mt-1">
                ou em até 10x de <span className="tabular-nums">{formatBRL(product.currentPrice / 10)}</span> sem juros
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-bunker-graphite rounded-sm">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-bunker-tan hover:bg-bunker-graphite"
                  aria-label="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 tabular-nums w-10 text-center">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 text-bunker-tan hover:bg-bunker-graphite"
                  aria-label="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-bunker-text-secondary">
                {product.stock > 0 ? `${product.stock} em estoque` : "Sob encomenda"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  addItem(product.id, qty);
                  toast.success("Adicionado ao carrinho", { description: `${qty}x ${product.name}` });
                }}
                className="flex-1 bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-sm py-3.5 rounded-sm hover:bg-bunker-tan-dark transition-colors"
              >
                Adicionar ao Carrinho
              </button>
              <Link
                to="/cart"
                onClick={() => addItem(product.id, qty)}
                className="flex-1 text-center border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-sm py-3.5 rounded-sm hover:bg-bunker-tan/10 transition-colors"
              >
                Comprar Agora
              </Link>
            </div>

            <div className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-4">
              <p className="text-xs uppercase font-bold tracking-wider mb-2 text-bunker-text-primary">Calcular frete</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="flex-1 bg-bunker-black border border-bunker-graphite rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-bunker-tan"
                  aria-label="CEP"
                />
                <button
                  type="button"
                  onClick={() => toast.info("Cálculo de frete será integrado em breve.")}
                  className="bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-xs px-4 rounded-sm hover:bg-bunker-tan-dark transition-colors"
                >
                  Calcular
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <Seal icon={<ShieldCheck className="w-5 h-5" />} label="Compra Segura" />
              <Seal icon={<Award className="w-5 h-5" />} label="Produto Original" />
              <Seal icon={<Package className="w-5 h-5" />} label="Garantia" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-t border-bunker-graphite">
          <div className="flex gap-1 border-b border-bunker-graphite">
            {([
              ["desc", "Descrição"],
              ["specs", "Especificações"],
              ["reviews", "Avaliações"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn(
                  "px-4 md:px-6 py-3 font-display uppercase tracking-wider text-sm transition-colors",
                  tab === k
                    ? "text-bunker-tan border-b-2 border-bunker-tan -mb-px"
                    : "text-bunker-text-secondary hover:text-bunker-text-primary",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="py-6 text-bunker-text-secondary leading-relaxed">
            {tab === "desc" && <p className="max-w-3xl">{product.description}</p>}
            {tab === "specs" && (
              <table className="w-full max-w-2xl text-sm">
                <tbody>
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k} className="border-b border-bunker-graphite">
                      <td className="py-2 pr-4 text-bunker-text-primary font-semibold w-1/3">{k}</td>
                      <td className="py-2">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "reviews" && (
              <div>
                <p className="text-bunker-text-primary font-display text-2xl">
                  {product.rating.toFixed(1)} <span className="text-bunker-text-secondary text-sm">/ 5.0</span>
                </p>
                <p className="text-sm">Baseado em {product.reviewsCount} avaliações verificadas.</p>
                <p className="mt-3 text-sm">Sistema de reviews completo será integrado com o backend em breve.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <SectionTitle title="Produtos Relacionados" subtitle="Operadores que escolheram este também levaram" />
            <ProductCarousel products={related} />
          </div>
        )}
      </div>
    </Layout>
  );
}

function Seal({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-bunker-charcoal border border-bunker-graphite rounded-sm py-3 px-2 text-center">
      <span className="text-bunker-military-light">{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-bunker-text-secondary leading-tight">{label}</span>
    </div>
  );
}
