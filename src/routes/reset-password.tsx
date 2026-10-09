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

interface ResetSearch {
  token: string;
  email: string;
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetSearch => ({
    token: typeof search.token === "string" ? search.token : "",
    email: typeof search.email === "string" ? search.email : "",
  }),
  head: () => ({ meta: [{ title: "Redefinir senha — Bunker 81 Airsoft" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token, email } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const invalidLink = !token || !email;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas informadas não coincidem.");
      return;
    }
    setPending(true);
    try {
      await sdk.auth.updateProvider("customer", "emailpass", { password }, token);
      await sdk.auth.logout();
      setSuccess(true);
    } catch {
      setError("Este link é inválido, expirou ou já foi utilizado. Solicite um novo link.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AccountPage
      eyebrow="Área do cliente"
      title="Redefinir senha"
      description="Crie uma nova senha para sua conta Bunker 81."
    >
      <AccountForm onSubmit={submit}>
        {success ? (
          <div className="text-center">
            <h2 className="font-display text-2xl uppercase tracking-wider">Senha alterada</h2>
            <p className="mt-3 text-sm text-bunker-text-secondary">
              A senha anterior não autentica mais. Entre novamente com a nova senha.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex bg-bunker-tan px-6 py-3 text-sm font-bold uppercase tracking-wider text-bunker-black"
            >
              Entrar
            </Link>
          </div>
        ) : invalidLink ? (
          <div className="text-center">
            <AccountError>Link de redefinição incompleto ou inválido.</AccountError>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex text-sm font-bold uppercase tracking-wider text-bunker-tan hover:underline"
            >
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <>
            {error && <AccountError>{error}</AccountError>}
            <p className="text-sm text-bunker-text-secondary">
              Redefinição para <strong className="text-bunker-text-primary">{email}</strong>
            </p>
            <label className="block text-sm font-medium">
              Nova senha
              <input
                className={accountInputClassName}
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Confirmar nova senha
              <input
                className={accountInputClassName}
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            <AccountSubmitButton pending={pending}>Alterar senha</AccountSubmitButton>
          </>
        )}
      </AccountForm>
    </AccountPage>
  );
}
