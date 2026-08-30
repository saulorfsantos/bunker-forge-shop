import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { formatBRL } from "@/data/mockData";
import {
  getActiveCartId,
  listPaymentProviders,
  listShippingOptions,
  placeOrder,
  retrieveCheckoutCart,
  saveCheckoutAddress,
  selectShippingOption,
  storeOrderReceipt,
  type CheckoutAddress,
  type CheckoutCart,
  type PaymentProvider,
  type ShippingOption,
} from "@/lib/checkout";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout seguro — Bunker 81 Airsoft" }],
  }),
  component: CheckoutPage,
});

type CheckoutStep = "address" | "shipping" | "payment";

const inputClassName =
  "mt-1.5 w-full rounded-sm border border-bunker-graphite bg-bunker-black px-3 py-2.5 text-sm text-bunker-text-primary outline-none transition-colors placeholder:text-bunker-text-secondary/60 focus:border-bunker-tan focus:ring-1 focus:ring-bunker-tan disabled:opacity-60";

const emptyAddress: CheckoutAddress = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "br",
  phone: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível avançar no checkout. Tente novamente.";
}

function providerLabel(providerId: string): string {
  if (providerId === "pp_system_default") return "Pagamento padrão da loja";
  return providerId.replace(/^pp_/, "").replaceAll("_", " ");
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, isLoading: isCartLoading, markCartCompleted } = useCart();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [cart, setCart] = useState<CheckoutCart | null>(null);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [paymentProviderId, setPaymentProviderId] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cartId = getActiveCartId();
    if (!cartId) {
      setIsBooting(false);
      return;
    }

    void retrieveCheckoutCart(cartId)
      .then((activeCart) => {
        setCart(activeCart);
        setEmail(activeCart.email ?? "");
      })
      .catch((loadError: unknown) => setError(getErrorMessage(loadError)))
      .finally(() => setIsBooting(false));
  }, []);

  const updateAddress = (field: keyof CheckoutAddress, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
  };

  const submitAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart) return;

    setError("");
    setIsSubmitting(true);
    try {
      const updatedCart = await saveCheckoutAddress(cart.id, email.trim(), {
        ...address,
        first_name: address.first_name.trim(),
        last_name: address.last_name.trim(),
        address_1: address.address_1.trim(),
        address_2: address.address_2?.trim() || undefined,
        city: address.city.trim(),
        province: address.province.trim().toUpperCase(),
        postal_code: address.postal_code.trim(),
        phone: address.phone.trim(),
      });
      const options = await listShippingOptions(cart.id);
      setCart(updatedCart);
      setShippingOptions(options);
      setShippingOptionId(options[0]?.id ?? "");
      if (!options.length) {
        setError(
          "O backend não retornou modalidades de frete para este endereço. Configure uma opção de fulfillment no Medusa para continuar.",
        );
        return;
      }
      setStep("shipping");
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitShipping = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart || !shippingOptionId) return;

    setError("");
    setIsSubmitting(true);
    try {
      const updatedCart = await selectShippingOption(cart.id, shippingOptionId);
      const providers = await listPaymentProviders();
      setCart(updatedCart);
      setPaymentProviders(providers);
      setPaymentProviderId(providers[0]?.id ?? "");
      if (!providers.length) {
        setError(
          "O backend não tem provedor de pagamento habilitado para a região Brasil. Configure um provedor no Medusa para continuar.",
        );
        return;
      }
      setStep("payment");
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart || !paymentProviderId) return;

    setError("");
    setIsSubmitting(true);
    try {
      const order = await placeOrder(cart, paymentProviderId);
      storeOrderReceipt(order);
      markCartCompleted();
      await navigate({
        to: "/order-confirmation",
        search: { order_id: order.id },
      });
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
      setIsSubmitting(false);
    }
  };

  if (isBooting || isCartLoading) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center px-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-bunker-tan" aria-label="Carregando" />
        </div>
      </Layout>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <PackageCheck className="mx-auto h-14 w-14 text-bunker-tan" />
          <h1 className="mt-5 font-display text-3xl uppercase tracking-wider">
            Nenhuma missão em andamento
          </h1>
          <p className="mt-2 text-sm text-bunker-text-secondary">
            Adicione produtos ao carrinho antes de iniciar o checkout.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex bg-bunker-tan px-6 py-3 text-sm font-bold uppercase tracking-wider text-bunker-black transition-colors hover:bg-bunker-tan-dark"
          >
            Explorar arsenal
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="border-b border-bunker-graphite bg-bunker-charcoal/50">
        <div className="mx-auto max-w-[1180px] px-4 py-7">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-bunker-text-secondary transition-colors hover:text-bunker-tan"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar ao carrinho
          </Link>
          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-bunker-tan">
                Protocolo de aquisição
              </p>
              <h1 className="mt-1 font-display text-3xl uppercase tracking-wider md:text-4xl">
                Checkout seguro
              </h1>
            </div>
            <StepIndicator current={step} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_350px] lg:py-12">
        <section className="min-w-0">
          {error && (
            <div
              role="alert"
              className="mb-5 border-l-2 border-bunker-danger bg-bunker-danger/10 px-4 py-3 text-sm text-bunker-text-primary"
            >
              {error}
            </div>
          )}

          {step === "address" && (
            <AddressForm
              address={address}
              email={email}
              isSubmitting={isSubmitting}
              onAddressChange={updateAddress}
              onEmailChange={setEmail}
              onSubmit={submitAddress}
            />
          )}
          {step === "shipping" && (
            <ShippingForm
              options={shippingOptions}
              selectedId={shippingOptionId}
              isSubmitting={isSubmitting}
              onBack={() => {
                setError("");
                setStep("address");
              }}
              onSelect={setShippingOptionId}
              onSubmit={submitShipping}
            />
          )}
          {step === "payment" && (
            <PaymentForm
              providers={paymentProviders}
              selectedId={paymentProviderId}
              isSubmitting={isSubmitting}
              onBack={() => {
                setError("");
                setStep("shipping");
              }}
              onSelect={setPaymentProviderId}
              onSubmit={submitOrder}
            />
          )}
        </section>

        <OrderSummary cart={cart} />
      </div>
    </Layout>
  );
}

function StepIndicator({ current }: { current: CheckoutStep }) {
  const steps: Array<{ id: CheckoutStep; label: string }> = [
    { id: "address", label: "Endereço" },
    { id: "shipping", label: "Frete" },
    { id: "payment", label: "Pagamento" },
  ];
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol className="flex items-center" aria-label="Etapas do checkout">
      {steps.map((step, index) => (
        <li key={step.id} className="flex items-center">
          {index > 0 && <span className="mx-2 h-px w-5 bg-bunker-graphite sm:w-9" />}
          <span
            className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
              index <= currentIndex ? "text-bunker-tan" : "text-bunker-text-secondary"
            }`}
          >
            <span
              className={`grid h-6 w-6 place-items-center border ${
                index <= currentIndex ? "border-bunker-tan" : "border-bunker-graphite"
              }`}
            >
              {index < currentIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

interface AddressFormProps {
  address: CheckoutAddress;
  email: string;
  isSubmitting: boolean;
  onAddressChange: (field: keyof CheckoutAddress, value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function AddressForm({
  address,
  email,
  isSubmitting,
  onAddressChange,
  onEmailChange,
  onSubmit,
}: AddressFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="border border-bunker-graphite bg-bunker-charcoal p-5 md:p-7"
    >
      <div className="flex items-center gap-3 border-b border-bunker-graphite pb-5">
        <MapPin className="h-6 w-6 text-bunker-tan" />
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider">Destino da entrega</h2>
          <p className="text-xs text-bunker-text-secondary">
            Estes dados são enviados diretamente ao carrinho Medusa.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="E-mail" className="sm:col-span-2">
          <input
            className={inputClassName}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
          />
        </Field>
        <Field label="Nome">
          <input
            className={inputClassName}
            autoComplete="given-name"
            value={address.first_name}
            onChange={(event) => onAddressChange("first_name", event.target.value)}
            required
          />
        </Field>
        <Field label="Sobrenome">
          <input
            className={inputClassName}
            autoComplete="family-name"
            value={address.last_name}
            onChange={(event) => onAddressChange("last_name", event.target.value)}
            required
          />
        </Field>
        <Field label="CEP">
          <input
            className={inputClassName}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            pattern="[0-9]{5}-?[0-9]{3}"
            value={address.postal_code}
            onChange={(event) => onAddressChange("postal_code", event.target.value)}
            required
          />
        </Field>
        <Field label="Telefone">
          <input
            className={inputClassName}
            type="tel"
            autoComplete="tel"
            value={address.phone}
            onChange={(event) => onAddressChange("phone", event.target.value)}
            required
          />
        </Field>
        <Field label="Endereço" className="sm:col-span-2">
          <input
            className={inputClassName}
            autoComplete="address-line1"
            placeholder="Rua, avenida e número"
            value={address.address_1}
            onChange={(event) => onAddressChange("address_1", event.target.value)}
            required
          />
        </Field>
        <Field label="Complemento" className="sm:col-span-2">
          <input
            className={inputClassName}
            autoComplete="address-line2"
            value={address.address_2 ?? ""}
            onChange={(event) => onAddressChange("address_2", event.target.value)}
          />
        </Field>
        <Field label="Cidade">
          <input
            className={inputClassName}
            autoComplete="address-level2"
            value={address.city}
            onChange={(event) => onAddressChange("city", event.target.value)}
            required
          />
        </Field>
        <Field label="UF">
          <input
            className={inputClassName}
            autoComplete="address-level1"
            maxLength={2}
            minLength={2}
            placeholder="PE"
            value={address.province}
            onChange={(event) => onAddressChange("province", event.target.value)}
            required
          />
        </Field>
      </div>
      <PrimaryButton isSubmitting={isSubmitting}>Consultar frete</PrimaryButton>
    </form>
  );
}

interface ShippingFormProps {
  options: ShippingOption[];
  selectedId: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSelect: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function ShippingForm({
  options,
  selectedId,
  isSubmitting,
  onBack,
  onSelect,
  onSubmit,
}: ShippingFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="border border-bunker-graphite bg-bunker-charcoal p-5 md:p-7"
    >
      <div className="flex items-center gap-3 border-b border-bunker-graphite pb-5">
        <Truck className="h-6 w-6 text-bunker-tan" />
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider">Modalidade de frete</h2>
          <p className="text-xs text-bunker-text-secondary">
            Opções calculadas e retornadas pelo backend para este carrinho.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-4 border p-4 transition-colors ${
              selectedId === option.id
                ? "border-bunker-tan bg-bunker-tan/5"
                : "border-bunker-graphite bg-bunker-black hover:border-bunker-tan/60"
            }`}
          >
            <input
              type="radio"
              name="shipping-option"
              value={option.id}
              checked={selectedId === option.id}
              onChange={() => onSelect(option.id)}
              className="accent-bunker-tan"
            />
            <span className="flex-1 text-sm font-semibold">{option.name}</span>
            <span className="price-tag text-sm">
              {typeof option.amount === "number"
                ? formatBRL(option.amount)
                : "Calculado ao aplicar"}
            </span>
          </label>
        ))}
      </div>
      <SecondaryButton onClick={onBack}>Editar endereço</SecondaryButton>
      <PrimaryButton isSubmitting={isSubmitting}>Aplicar frete</PrimaryButton>
    </form>
  );
}

interface PaymentFormProps {
  providers: PaymentProvider[];
  selectedId: string;
  isSubmitting: boolean;
  onBack: () => void;
  onSelect: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function PaymentForm({
  providers,
  selectedId,
  isSubmitting,
  onBack,
  onSelect,
  onSubmit,
}: PaymentFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="border border-bunker-graphite bg-bunker-charcoal p-5 md:p-7"
    >
      <div className="flex items-center gap-3 border-b border-bunker-graphite pb-5">
        <CreditCard className="h-6 w-6 text-bunker-tan" />
        <div>
          <h2 className="font-display text-xl uppercase tracking-wider">Pagamento</h2>
          <p className="text-xs text-bunker-text-secondary">
            Somente provedores realmente habilitados na região Brasil.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {providers.map((provider) => (
          <label
            key={provider.id}
            className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${
              selectedId === provider.id
                ? "border-bunker-tan bg-bunker-tan/5"
                : "border-bunker-graphite bg-bunker-black hover:border-bunker-tan/60"
            }`}
          >
            <input
              type="radio"
              name="payment-provider"
              value={provider.id}
              checked={selectedId === provider.id}
              onChange={() => onSelect(provider.id)}
              className="mt-1 accent-bunker-tan"
            />
            <span>
              <span className="block text-sm font-semibold capitalize">
                {providerLabel(provider.id)}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-bunker-text-secondary">
                O pedido será registrado no provedor nativo do backend. Esta vitrine não coleta nem
                simula dados de cartão.
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-5 flex items-start gap-3 border border-bunker-military-light/40 bg-bunker-military/10 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-bunker-military-light" />
        <p className="text-xs leading-relaxed text-bunker-text-secondary">
          Ao confirmar, o Medusa inicializa a sessão no provedor selecionado e só então tenta criar
          o pedido. Falhas do provedor permanecem visíveis e o carrinho é preservado.
        </p>
      </div>
      <SecondaryButton onClick={onBack}>Editar frete</SecondaryButton>
      <PrimaryButton isSubmitting={isSubmitting}>Confirmar pedido</PrimaryButton>
    </form>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-wider text-bunker-text-secondary ${className}`}
    >
      {label}
      {children}
    </label>
  );
}

function PrimaryButton({ isSubmitting, children }: { isSubmitting: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="mt-5 flex w-full items-center justify-center gap-2 bg-bunker-tan py-3 text-sm font-bold uppercase tracking-wider text-bunker-black transition-colors hover:bg-bunker-tan-dark disabled:cursor-wait disabled:opacity-60"
    >
      {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 w-full border border-bunker-graphite py-2.5 text-xs font-bold uppercase tracking-wider text-bunker-text-secondary transition-colors hover:border-bunker-tan hover:text-bunker-tan"
    >
      {children}
    </button>
  );
}

function OrderSummary({ cart }: { cart: CheckoutCart }) {
  const itemTotal = cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <aside className="self-start border border-bunker-graphite bg-bunker-charcoal p-5 lg:sticky lg:top-44">
      <div className="flex items-center justify-between border-b border-bunker-graphite pb-4">
        <h2 className="font-display uppercase tracking-wider text-bunker-tan">
          Resumo da operação
        </h2>
        <span className="text-xs text-bunker-text-secondary">
          {itemTotal} {itemTotal === 1 ? "item" : "itens"}
        </span>
      </div>
      <ul className="divide-y divide-bunker-graphite">
        {cart.items?.map((item) => (
          <li key={item.id} className="flex gap-3 py-3 text-sm">
            <span className="grid h-7 w-7 shrink-0 place-items-center border border-bunker-graphite bg-bunker-black text-xs text-bunker-tan">
              {item.quantity}x
            </span>
            <span className="line-clamp-2 flex-1 text-bunker-text-secondary">
              {item.title ?? "Produto"}
            </span>
            {typeof item.unit_price === "number" && (
              <span className="tabular-nums">{formatBRL(item.unit_price * item.quantity)}</span>
            )}
          </li>
        ))}
      </ul>
      <dl className="space-y-2 border-t border-bunker-graphite pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-bunker-text-secondary">Subtotal</dt>
          <dd>{formatBRL(cart.subtotal ?? 0)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-bunker-text-secondary">Frete</dt>
          <dd>{formatBRL(cart.shipping_total ?? 0)}</dd>
        </div>
        <div className="flex justify-between border-t border-bunker-graphite pt-3 text-base font-bold">
          <dt className="uppercase tracking-wider">Total</dt>
          <dd className="price-tag text-xl">{formatBRL(cart.total ?? cart.subtotal ?? 0)}</dd>
        </div>
      </dl>
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-bunker-text-secondary">
        <LockKeyhole className="h-3.5 w-3.5 text-bunker-military-light" />
        Conexão direta com Medusa Store API
      </div>
    </aside>
  );
}
