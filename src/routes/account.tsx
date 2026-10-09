import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircle, PackageOpen, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { AccountError, AccountPage, LoginRequired } from "@/components/account/AccountPage";
import { useCustomer } from "@/contexts/CustomerContext";
import {
  getCustomerOrderNumber,
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  listCustomerOrders,
  type CustomerOrder,
} from "@/lib/customer-account";
import { formatBRL } from "@/lib/money";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Minha conta — Bunker 81 Airsoft" }] }),
  component: AccountPageRoute,
});

function AccountPageRoute() {
  const navigate = useNavigate();
  const { customer, isLoading: isCustomerLoading, logout } = useCustomer();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isCustomerLoading) return;
    if (!customer) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError("");
    void listCustomerOrders()
      .then((result) => {
        if (!cancelled) setOrders(result);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar seus pedidos. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customer, isCustomerLoading]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError("");
    try {
      await logout();
      await navigate({ to: "/login" });
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AccountPage
      eyebrow="Área do cliente"
      title="Minha conta"
      description="Consulte somente os pedidos vinculados à sua conta."
    >
      {isCustomerLoading ? (
        <Loading label="Validando sessão..." />
      ) : !customer ? (
        <LoginRequired />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 border border-bunker-graphite bg-bunker-charcoal p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-bunker-text-secondary">
                Conta autenticada
              </p>
              <p className="mt-1 font-medium">
                {[customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
                  customer.email}
              </p>
              <p className="text-sm text-bunker-text-secondary">{customer.email}</p>
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="border border-bunker-graphite px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-bunker-text-secondary hover:border-bunker-tan hover:text-bunker-tan disabled:opacity-60"
            >
              {isLoggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>

          {error && <AccountError>{error}</AccountError>}
          <section aria-labelledby="orders-heading">
            <div className="mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-bunker-tan" />
              <h2 id="orders-heading" className="font-display text-2xl uppercase tracking-wider">
                Meus pedidos
              </h2>
            </div>
            {isLoading ? (
              <Loading label="Carregando pedidos..." />
            ) : orders.length === 0 ? (
              <div className="border border-bunker-graphite bg-bunker-charcoal p-8 text-center">
                <PackageOpen className="mx-auto h-10 w-10 text-bunker-text-secondary" />
                <p className="mt-4 font-medium">Nenhum pedido vinculado a esta conta.</p>
                <p className="mt-1 text-sm text-bunker-text-secondary">
                  Compras como convidado não são associadas automaticamente por e-mail.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-flex text-sm font-bold uppercase tracking-wider text-bunker-tan hover:underline"
                >
                  Explorar produtos
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to="/account/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="grid gap-4 border border-bunker-graphite bg-bunker-charcoal p-5 transition-colors hover:border-bunker-tan sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-display text-xl tracking-wider text-bunker-tan">
                            {getCustomerOrderNumber(order)}
                          </span>
                          {order.created_at && (
                            <time
                              className="text-xs text-bunker-text-secondary"
                              dateTime={order.created_at}
                            >
                              {formatOrderDate(order.created_at)}
                            </time>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-bunker-text-secondary">
                          {getOrderStatusLabel(order.status)} ·{" "}
                          {getPaymentStatusLabel(order.payment_status)} ·{" "}
                          {getFulfillmentStatusLabel(order.fulfillment_status)}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        {typeof order.total === "number" && (
                          <p className="price-tag text-xl">{formatBRL(order.total)}</p>
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-bunker-tan">
                          Ver detalhes
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AccountPage>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 border border-bunker-graphite bg-bunker-charcoal p-10 text-sm text-bunker-text-secondary">
      <LoaderCircle className="h-5 w-5 animate-spin text-bunker-tan" />
      {label}
    </div>
  );
}

function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
