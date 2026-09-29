import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/lib/money";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeProductImage } from "@/components/SafeProductImage";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Carrinho — Bunker 81 Airsoft" }],
  }),
  component: CartPage,
});

function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    totalPrice,
    getProduct,
    clearCart,
    isLoading,
    isPending,
  } = useCart();

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-sm" />
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-bunker-tan mb-4" />
          <h1 className="font-display text-3xl uppercase tracking-wider">Carrinho vazio</h1>
          <p className="text-bunker-text-secondary mt-2">
            Você ainda não adicionou nenhum item ao seu loadout.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-sm px-6 py-3 rounded-sm hover:bg-bunker-tan-dark transition-colors"
          >
            Explorar Arsenal
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wider mb-6 border-l-2 border-bunker-tan pl-4">
          Seu Carrinho
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-3">
            {items.map((item) => {
              const p = getProduct(item.id);
              if (!p) return null;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 bg-bunker-charcoal border border-bunker-graphite rounded-sm p-3 md:p-4"
                >
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="shrink-0 w-24 h-24 bg-bunker-black border border-bunker-graphite rounded-sm overflow-hidden"
                  >
                    <SafeProductImage
                      src={p.images[0]}
                      alt={p.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <Link
                      to="/product/$id"
                      params={{ id: p.id }}
                      className="text-sm font-semibold text-bunker-text-primary hover:text-bunker-tan line-clamp-2"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-bunker-text-secondary mt-1">{p.brand}</p>
                    {p.variantTitle && p.variantTitle.toLowerCase() !== "default variant" && (
                      <p className="text-xs text-bunker-text-secondary mt-1">
                        Variante: {p.variantTitle}
                      </p>
                    )}
                    {p.sku && (
                      <p className="text-[11px] uppercase tracking-wider text-bunker-text-secondary mt-1">
                        SKU {p.sku}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div className="flex items-center border border-bunker-graphite rounded-sm">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-bunker-tan hover:bg-bunker-graphite disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-bunker-tan hover:bg-bunker-graphite disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="price-tag text-base">
                        {p.priceAvailable
                          ? formatBRL(p.currentPrice * item.quantity)
                          : "Preço indisponível"}
                      </p>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => void removeItem(item.id)}
                        aria-label="Remover"
                        className="text-bunker-text-secondary hover:text-bunker-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              disabled={isPending}
              onClick={() => void clearCart()}
              className="text-xs uppercase tracking-wider text-bunker-text-secondary hover:text-bunker-danger disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Esvaziar carrinho
            </button>
          </div>

          {/* Summary */}
          <aside className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-5 self-start lg:sticky lg:top-44">
            <h2 className="font-display uppercase tracking-wider text-bunker-tan mb-4">
              Resumo do pedido
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-bunker-text-secondary">Total dos produtos</dt>
                <dd className="tabular-nums">
                  {totalPrice === null ? "Preço indisponível" : formatBRL(totalPrice)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-bunker-text-secondary">Recebimento</dt>
                <dd className="text-xs text-bunker-text-secondary">Definido no checkout</dd>
              </div>
              <div className="border-t border-bunker-graphite pt-3 flex justify-between text-base">
                <dt className="font-bold uppercase tracking-wider">Subtotal</dt>
                <dd className="price-tag text-xl">
                  {totalPrice === null ? "Preço indisponível" : formatBRL(totalPrice)}
                </dd>
              </div>
              <p className="text-xs text-bunker-text-secondary">
                O total final será confirmado após a seleção da entrega ou retirada.
              </p>
            </dl>
            {totalPrice === null ? (
              <p
                role="alert"
                className="mt-5 border border-bunker-danger bg-bunker-danger/10 px-4 py-3 text-xs leading-relaxed text-bunker-text-primary"
              >
                O checkout fica indisponível enquanto algum item estiver sem preço confirmado.
              </p>
            ) : (
              <Link
                to="/checkout"
                className="mt-5 flex w-full items-center justify-center bg-bunker-tan py-3 text-sm font-bold uppercase tracking-wider text-bunker-black transition-colors hover:bg-bunker-tan-dark"
              >
                Finalizar pedido
              </Link>
            )}
            <Link
              to="/"
              className="mt-3 block text-center text-xs uppercase tracking-wider text-bunker-tan hover:underline"
            >
              Continuar comprando
            </Link>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
