import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/data/mockData";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Carrinho — Bunker 81 Airsoft" }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, getProduct, clearCart } = useCart();

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

  const shipping = totalPrice >= 499 ? 0 : 49.9;
  const grandTotal = totalPrice + shipping;

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wider mb-6 border-l-2 border-bunker-tan pl-4">
          Seu Carrinho
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-3">
            {items.map((item) => {
              const p = getProduct(item.productId);
              if (!p) return null;
              return (
                <div
                  key={item.productId}
                  className="flex gap-4 bg-bunker-charcoal border border-bunker-graphite rounded-sm p-3 md:p-4"
                >
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="shrink-0 w-24 h-24 bg-bunker-black border border-bunker-graphite rounded-sm overflow-hidden"
                  >
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
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
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div className="flex items-center border border-bunker-graphite rounded-sm">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-2 py-1 text-bunker-tan hover:bg-bunker-graphite"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-2 py-1 text-bunker-tan hover:bg-bunker-graphite"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="price-tag text-base">{formatBRL(p.currentPrice * item.quantity)}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remover"
                        className="text-bunker-text-secondary hover:text-bunker-danger transition-colors"
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
              onClick={clearCart}
              className="text-xs uppercase tracking-wider text-bunker-text-secondary hover:text-bunker-danger"
            >
              Esvaziar carrinho
            </button>
          </div>

          {/* Summary */}
          <aside className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-5 self-start lg:sticky lg:top-44">
            <h2 className="font-display uppercase tracking-wider text-bunker-tan mb-4">Resumo do pedido</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-bunker-text-secondary">Subtotal</dt>
                <dd className="tabular-nums">{formatBRL(totalPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-bunker-text-secondary">Frete</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? <span className="text-bunker-military-light">Grátis</span> : formatBRL(shipping)}
                </dd>
              </div>
              <div className="border-t border-bunker-graphite pt-3 flex justify-between text-base">
                <dt className="font-bold uppercase tracking-wider">Total</dt>
                <dd className="price-tag text-xl">{formatBRL(grandTotal)}</dd>
              </div>
              <p className="text-xs text-bunker-text-secondary">
                ou 10x de <span className="tabular-nums">{formatBRL(grandTotal / 10)}</span> sem juros
              </p>
            </dl>
            <button
              type="button"
              onClick={() => alert("Checkout será integrado em breve.")}
              className="mt-5 w-full bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-sm py-3 rounded-sm hover:bg-bunker-tan-dark transition-colors"
            >
              Finalizar Compra
            </button>
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
