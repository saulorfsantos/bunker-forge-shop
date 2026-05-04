import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import mascote from "@/assets/mascote.png";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bunker-black px-4 text-center">
      <img src={mascote} alt="Mascote Bunker 81" className="w-48 h-auto mb-6" />
      <h1 className="font-display text-7xl text-bunker-tan">404</h1>
      <h2 className="mt-2 font-display uppercase tracking-wider text-2xl text-bunker-text-primary">
        Operação abortada
      </h2>
      <p className="mt-3 max-w-md text-sm text-bunker-text-secondary">
        Esta página não existe ou foi removida do nosso arsenal. Volte ao QG e escolha outra missão.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-sm bg-bunker-tan px-6 py-3 text-sm font-bold uppercase tracking-wider text-bunker-black hover:bg-bunker-tan-dark transition-colors"
      >
        Voltar ao QG
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bunker 81 Airsoft — Onde a missão começa" },
      { name: "description", content: "Loja online de Airsoft, armas de pressão e equipamentos táticos. Arsenal completo para operadores sérios." },
      { name: "author", content: "Bunker 81 Airsoft" },
      { property: "og:title", content: "Bunker 81 Airsoft — Onde a missão começa" },
      { property: "og:description", content: "Loja online de Airsoft, armas de pressão e equipamentos táticos. Arsenal completo para operadores sérios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Bunker 81 Airsoft — Onde a missão começa" },
      { name: "twitter:description", content: "Loja online de Airsoft, armas de pressão e equipamentos táticos. Arsenal completo para operadores sérios." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cbf35088-894b-4750-980a-5cb5f7696a6a/id-preview-09b96103--6d0ebff1-6f32-47ed-9910-556823083cee.lovable.app-1777011020911.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cbf35088-894b-4750-980a-5cb5f7696a6a/id-preview-09b96103--6d0ebff1-6f32-47ed-9910-556823083cee.lovable.app-1777011020911.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="bg-bunker-black text-bunker-text-primary">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <Outlet />
        <Toaster />
      </FavoritesProvider>
    </CartProvider>
  );
}
