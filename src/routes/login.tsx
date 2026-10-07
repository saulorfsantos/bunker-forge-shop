import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  AccountError,
  AccountForm,
  AccountPage,
  AccountSubmitButton,
  accountInputClassName,
} from "@/components/account/AccountPage";
import { useCustomer } from "@/contexts/CustomerContext";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Bunker 81 Airsoft" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useCustomer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await login(email, password);
      await navigate({ to: "/account" });
    } catch {
      setError("E-mail ou senha inválidos. Confira os dados e tente novamente.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AccountPage
      eyebrow="Área do cliente"
      title="Entrar"
      description="Acesse seus pedidos com sua conta Bunker 81."
    >
      <AccountForm onSubmit={submit}>
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
        <label className="block text-sm font-medium">
          Senha
          <input
            className={accountInputClassName}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <AccountSubmitButton pending={pending}>Entrar</AccountSubmitButton>
        <div className="flex flex-col gap-2 text-center text-sm text-bunker-text-secondary sm:flex-row sm:justify-between">
          <Link to="/forgot-password" className="hover:text-bunker-tan">
            Esqueci minha senha
          </Link>
          <Link to="/register" className="hover:text-bunker-tan">
            Criar conta
          </Link>
        </div>
      </AccountForm>
    </AccountPage>
  );
}
