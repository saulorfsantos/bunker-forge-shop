import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sdk } from "@/lib/medusa";
import { useCart } from "@/contexts/CartContext";

export interface StoreCustomer {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface CustomerContextValue {
  customer: StoreCustomer | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<StoreCustomer | null>;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

function isUnauthorized(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "status" in error &&
    ((error as { status?: number }).status === 401 ||
      (error as { status?: number }).status === 403),
  );
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { transferCartToCustomer, startGuestCart } = useCart();

  const refreshCustomer = useCallback(async (): Promise<StoreCustomer | null> => {
    try {
      const { customer: currentCustomer } = await sdk.store.customer.retrieve();
      const value = currentCustomer as StoreCustomer;
      setCustomer(value);
      return value;
    } catch (error) {
      if (!isUnauthorized(error)) {
        console.error("[CustomerContext] Failed to retrieve customer:", error);
      }
      setCustomer(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshCustomer().finally(() => setIsLoading(false));
  }, [refreshCustomer]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await sdk.auth.login("customer", "emailpass", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (typeof result !== "string") {
        throw new Error("Este método de acesso exige uma etapa adicional não suportada.");
      }

      const currentCustomer = await refreshCustomer();
      if (!currentCustomer) {
        await sdk.auth.logout();
        throw new Error("Não foi possível validar a conta do cliente.");
      }
      try {
        await transferCartToCustomer();
      } catch (error) {
        await sdk.auth.logout();
        setCustomer(null);
        throw error;
      }
    },
    [refreshCustomer, transferCartToCustomer],
  );

  const register = useCallback(
    async ({ email, password, firstName, lastName }: RegisterInput) => {
      const normalizedEmail = email.trim().toLowerCase();
      await sdk.auth.register("customer", "emailpass", {
        email: normalizedEmail,
        password,
      });
      await sdk.store.customer.create({
        email: normalizedEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      // A registration token has no actor_id. A fresh login mints the customer token.
      await login(normalizedEmail, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await sdk.auth.logout();
    setCustomer(null);
    try {
      await startGuestCart();
    } catch (error) {
      console.error("[CustomerContext] Failed to initialize guest cart after logout:", error);
    }
  }, [startGuestCart]);

  const value = useMemo<CustomerContextValue>(
    () => ({ customer, isLoading, login, register, logout, refreshCustomer }),
    [customer, isLoading, login, register, logout, refreshCustomer],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer(): CustomerContextValue {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used within CustomerProvider");
  return context;
}
