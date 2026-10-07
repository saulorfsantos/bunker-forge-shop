import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  AccountError,
  AccountForm,
  AccountPage,
  AccountSubmitButton,
  accountInputClassName,
} from "@/components/account/AccountPage";
import { sdk } from "@/lib/medusa";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — Bunker 81 Airsoft" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await sdk.auth.resetPassword("customer", "emailpass", {
        identifier: email.trim().toLowerCase(),
      });
      setSent(true);
    } catch {
      setError("Não foi possível solicitar o link agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AccountPage
      eyebrow="Área do cliente"
      title="Recuperar senha"
      description="Enviaremos um link temporário se houver uma conta para o e-mail informado."
    >
      <AccountForm onSubmit={submit}>
        {sent ? (
          <div className="text-center">
            <h2 className="font-display text-2xl uppercase tracking-wider">Confira seu e-mail</h2>
            <p className="mt-3 text-sm text-bunker-text-secondary">
              Se a conta existir, o link de redefinição chegará em instantes e expirará em 15
              minutos.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex text-sm font-bold uppercase tracking-wider text-bunker-tan hover:underline"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            {error && <AccountError>{error}</AccountError>}
            <label className="block text-sm font-medium">
              E-mail
              <input
                className={accountInputClassName}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <AccountSubmitButton pending={pending}>Enviar link</AccountSubmitButton>
          </>
        )}
      </AccountForm>
    </AccountPage>
  );
}
