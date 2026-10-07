import type { FormEvent, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const accountInputClassName =
  "mt-1.5 w-full rounded-sm border border-bunker-graphite bg-bunker-black px-3 py-2.5 text-sm text-bunker-text-primary outline-none transition-colors placeholder:text-bunker-text-secondary/60 focus:border-bunker-tan focus:ring-1 focus:ring-bunker-tan disabled:opacity-60";

export function AccountPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Layout>
      <div className="border-b border-bunker-graphite bg-bunker-charcoal/50">
        <div className="mx-auto max-w-5xl px-4 py-8 md:py-11">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-bunker-tan">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wider md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-bunker-text-secondary">{description}</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">{children}</div>
    </Layout>
  );
}

export function AccountForm({
  onSubmit,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-5 border border-bunker-graphite bg-bunker-charcoal p-5 sm:p-7"
    >
      {children}
    </form>
  );
}

export function AccountError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="border-l-2 border-bunker-danger bg-bunker-danger/10 px-4 py-3 text-sm"
    >
      {children}
    </p>
  );
}

export function AccountSubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-bunker-tan px-5 py-3 text-sm font-bold uppercase tracking-wider text-bunker-black transition-colors hover:bg-bunker-tan-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Aguarde..." : children}
    </button>
  );
}

export function LoginRequired() {
  return (
    <div className="mx-auto max-w-xl border border-bunker-graphite bg-bunker-charcoal p-7 text-center">
      <h2 className="font-display text-2xl uppercase tracking-wider">Acesso necessário</h2>
      <p className="mt-2 text-sm text-bunker-text-secondary">
        Entre com sua conta para consultar pedidos e dados do cliente.
      </p>
      <Link
        to="/login"
        className="mt-6 inline-flex bg-bunker-tan px-6 py-3 text-sm font-bold uppercase tracking-wider text-bunker-black"
      >
        Entrar
      </Link>
    </div>
  );
}
