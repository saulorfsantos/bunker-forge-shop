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

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Criar conta — Bunker 81 Airsoft" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useCustomer();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmation: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmation) {
      setError("As senhas informadas não coincidem.");
      return;
    }
    setPending(true);
    try {
      await register(form);
      await navigate({ to: "/account" });
    } catch {
      setError("Não foi possível criar a conta. Verifique os dados ou tente entrar.");
    } finally {
      setPending(false);
    }
  };

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <AccountPage
      eyebrow="Área do cliente"
      title="Criar conta"
      description="Cadastre-se para acompanhar as compras feitas enquanto estiver autenticado."
    >
      <AccountForm onSubmit={submit}>
        {error && <AccountError>{error}</AccountError>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Nome
            <input
              className={accountInputClassName}
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(event) => update("firstName", event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Sobrenome
            <input
              className={accountInputClassName}
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(event) => update("lastName", event.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          E-mail
          <input
            className={accountInputClassName}
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Senha
          <input
            className={accountInputClassName}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Confirmar senha
          <input
            className={accountInputClassName}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.confirmation}
            onChange={(event) => update("confirmation", event.target.value)}
          />
        </label>
        <AccountSubmitButton pending={pending}>Criar conta</AccountSubmitButton>
        <p className="text-center text-sm text-bunker-text-secondary">
          Já possui conta?{" "}
          <Link to="/login" className="text-bunker-tan hover:underline">
            Entrar
          </Link>
        </p>
      </AccountForm>
    </AccountPage>
  );
}
