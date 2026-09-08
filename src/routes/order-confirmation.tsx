import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, LoaderCircle, PackageCheck, ReceiptText, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { getOrderStatusLabel } from "@/lib/checkout-copy";
import { formatBRL } from "@/lib/money";
import { readStoredOrderReceipt, retrieveOrder, type OrderReceipt } from "@/lib/checkout";

interface ConfirmationSearch {
  order_id: string;
}

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (search: Record<string, unknown>): ConfirmationSearch => ({
    order_id: typeof search.order_id === "string" ? search.order_id : "",
  }),
  head: () => ({
    meta: [{ title: "Pedido confirmado — Bunker 81 Airsoft" }],
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { order_id: orderId } = Route.useSearch();
  const [order, setOrder] = useState<OrderReceipt | null>(() =>
    orderId ? readStoredOrderReceipt(orderId) : null,
  );
  const [isLoading, setIsLoading] = useState(Boolean(orderId && !order));
  const [error, setError] = useState("");
  const isVerified = Boolean(order);

  useEffect(() => {
    if (!orderId || order) return;
    void retrieveOrder(orderId)
      .then(setOrder)
      .catch(() => {
        setError(
          "Não foi possível recarregar os detalhes do pedido. Use a referência abaixo ao falar com a Bunker 81.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [order, orderId]);

  return (
    <Layout>
      <div className="relative overflow-hidden border-b border-bunker-graphite bg-bunker-charcoal">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,transparent_49%,var(--color-bunker-tan)_50%,transparent_51%),linear-gradient(0deg,transparent_49%,var(--color-bunker-tan)_50%,transparent_51%)] [background-size:44px_44px]" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
          <div className="mx-auto grid h-16 w-16 place-items-center border border-bunker-military-light bg-bunker-military/20">
            {isVerified ? (
              <CheckCircle2 className="h-9 w-9 text-bunker-military-light" />
            ) : isLoading ? (
              <LoaderCircle className="h-8 w-8 animate-spin text-bunker-tan" />
            ) : (
              <ReceiptText className="h-8 w-8 text-bunker-text-secondary" />
            )}
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-bunker-tan">
            {isVerified
              ? "Pedido recebido"
              : isLoading
                ? "Consulta em andamento"
                : "Detalhes indisponíveis"}
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-wider md:text-5xl">
            {isVerified
              ? "Pedido confirmado"
              : isLoading
                ? "Validando pedido"
                : "Confirmação indisponível"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-bunker-text-secondary">
            {isVerified
              ? "Seu pedido foi confirmado. Guarde a identificação abaixo para acompanhar o atendimento com a Bunker 81."
              : "Não foi possível exibir os detalhes do pedido. Confira a identificação informada ou tente novamente."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {isLoading && (
          <div className="flex items-center justify-center gap-3 border border-bunker-graphite bg-bunker-charcoal p-8 text-sm text-bunker-text-secondary">
            <LoaderCircle className="h-5 w-5 animate-spin text-bunker-tan" />
            Consultando os dados do pedido...
          </div>
        )}

        {!isLoading && order && <Receipt order={order} />}

        {!isLoading && !order && (
          <div className="border-l-2 border-bunker-danger bg-bunker-danger/10 p-5 text-sm">
            {error || "Não foi informada uma identificação de pedido válida."}
            {orderId && (
              <p className="mt-2 break-all font-mono text-xs text-bunker-text-secondary">
                Referência: {orderId}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            to="/"
            className="bg-bunker-tan px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-bunker-black transition-colors hover:bg-bunker-tan-dark"
          >
            Voltar ao arsenal
          </Link>
          <Link
            to="/cart"
            className="border border-bunker-graphite px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-bunker-text-secondary transition-colors hover:border-bunker-tan hover:text-bunker-tan"
          >
            Ver novo carrinho
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function Receipt({ order }: { order: OrderReceipt }) {
  const orderLabel = order.display_id ? `#${order.display_id}` : order.id;
  return (
    <article className="border border-bunker-graphite bg-bunker-charcoal">
      <header className="flex flex-col justify-between gap-3 border-b border-bunker-graphite p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <ReceiptText className="h-6 w-6 text-bunker-tan" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-bunker-text-secondary">
              Identificação do pedido
            </p>
            <p className="mt-0.5 break-all font-display text-xl tracking-wider text-bunker-tan">
              {orderLabel}
            </p>
          </div>
        </div>
        {order.created_at && (
          <time className="text-xs text-bunker-text-secondary" dateTime={order.created_at}>
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(order.created_at))}
          </time>
        )}
      </header>

      <div className="p-5">
        <dl className="grid gap-4 border-b border-bunker-graphite pb-5 sm:grid-cols-2">
          <ReceiptDatum label="E-mail" value={order.email ?? "Informado no checkout"} />
          <ReceiptDatum label="Status" value={getOrderStatusLabel(order.status)} />
        </dl>

        {order.items && order.items.length > 0 && (
          <ul className="divide-y divide-bunker-graphite py-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <PackageCheck className="h-4 w-4 shrink-0 text-bunker-military-light" />
                <span className="flex-1 text-bunker-text-secondary">
                  {item.quantity}x {item.title ?? "Produto"}
                </span>
                {typeof item.unit_price === "number" && (
                  <span className="tabular-nums">{formatBRL(item.unit_price * item.quantity)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-end justify-between border-t border-bunker-graphite pt-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-bunker-text-secondary">
            <ShieldCheck className="h-4 w-4 text-bunker-military-light" />
            Pedido confirmado com segurança
          </div>
          {typeof order.total === "number" && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-bunker-text-secondary">
                Total
              </p>
              <p className="price-tag text-2xl">{formatBRL(order.total)}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ReceiptDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-bunker-text-secondary">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
