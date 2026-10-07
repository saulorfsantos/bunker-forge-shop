import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, LoaderCircle, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountError, AccountPage, LoginRequired } from "@/components/account/AccountPage";
import { useCustomer } from "@/contexts/CustomerContext";
import {
  getCustomerOrderNumber,
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  retrieveCustomerOrder,
  type CustomerOrder,
} from "@/lib/customer-account";
import { formatBRL } from "@/lib/money";

export const Route = createFileRoute("/account/orders/$orderId")({
  head: () => ({ meta: [{ title: "Detalhes do pedido — Bunker 81 Airsoft" }] }),
  component: CustomerOrderPage,
});

function CustomerOrderPage() {
  const { orderId } = Route.useParams();
  const { customer, isLoading: isCustomerLoading } = useCustomer();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isCustomerLoading) return;
    if (!customer) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError("");
    void retrieveCustomerOrder(orderId)
      .then((result) => {
        if (cancelled) return;
        setOrder(result);
        if (!result) setError("Pedido não encontrado nesta conta.");
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível consultar este pedido.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer, isCustomerLoading, orderId]);

  return (
    <AccountPage
      eyebrow="Meus pedidos"
      title={order ? getCustomerOrderNumber(order) : "Detalhes do pedido"}
      description="Dados consultados pela sessão autenticada do comprador."
    >
      {isCustomerLoading ? (
        <Loading />
      ) : !customer ? (
        <LoginRequired />
      ) : isLoading ? (
        <Loading />
      ) : error || !order ? (
        <div className="space-y-5">
          <AccountError>{error || "Pedido indisponível."}</AccountError>
          <BackLink />
        </div>
      ) : (
        <div className="space-y-5">
          <BackLink />
          <article className="border border-bunker-graphite bg-bunker-charcoal">
            <header className="grid gap-4 border-b border-bunker-graphite p-5 sm:grid-cols-3">
              <Status label="Pedido" value={getOrderStatusLabel(order.status)} />
              <Status label="Pagamento" value={getPaymentStatusLabel(order.payment_status)} />
              <Status label="Entrega" value={getFulfillmentStatusLabel(order.fulfillment_status)} />
            </header>
            <div className="p-5">
              <h2 className="font-display text-xl uppercase tracking-wider">Itens</h2>
              {order.items?.length ? (
                <ul className="mt-3 divide-y divide-bunker-graphite">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-4">
                      <PackageCheck className="h-5 w-5 shrink-0 text-bunker-military-light" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{item.title || "Produto"}</p>
                        <p className="text-xs text-bunker-text-secondary">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      {typeof item.total === "number" ? (
                        <span className="tabular-nums">{formatBRL(item.total)}</span>
                      ) : typeof item.unit_price === "number" ? (
                        <span className="tabular-nums">
                          {formatBRL(item.unit_price * item.quantity)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-bunker-text-secondary">Itens indisponíveis.</p>
              )}
              <div className="mt-4 flex items-end justify-between border-t border-bunker-graphite pt-5">
                <div>
                  {order.created_at && (
                    <time
                      className="text-xs text-bunker-text-secondary"
                      dateTime={order.created_at}
                    >
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "long",
                        timeStyle: "short",
                      }).format(new Date(order.created_at))}
                    </time>
                  )}
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
        </div>
      )}
    </AccountPage>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-bunker-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 border border-bunker-graphite bg-bunker-charcoal p-10 text-sm text-bunker-text-secondary">
      <LoaderCircle className="h-5 w-5 animate-spin text-bunker-tan" />
      Carregando pedido...
    </div>
  );
}
function BackLink() {
  return (
    <Link
      to="/account"
      className="inline-flex items-center gap-1 text-sm text-bunker-text-secondary hover:text-bunker-tan"
    >
      <ChevronLeft className="h-4 w-4" />
      Voltar aos pedidos
    </Link>
  );
}
