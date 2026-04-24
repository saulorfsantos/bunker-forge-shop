# Bunker 81 Airsoft

E-commerce completo da Bunker 81 Airsoft — "Onde a missão começa".

## Stack

- **Vite 7** + **React 19** + **TypeScript** (strict)
- **TanStack Router v1** em modo SPA puro (file-based routing, sem SSR)
- **Tailwind CSS v4** com design system "Tactical Dark"
- **shadcn/ui** + **lucide-react** + **sonner** para toasts
- **Zod** + `@tanstack/zod-adapter` para validação de search params

## Estrutura de pastas

```
src/
├── assets/              # Imagens da marca (logo-shield, mascote, background)
├── components/          # Componentes reutilizáveis
│   ├── ui/              # shadcn/ui
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx
│   ├── ProductCard.tsx
│   ├── ProductCarousel.tsx
│   ├── CategoryCard.tsx
│   ├── BunkerBadge.tsx
│   ├── PriceTag.tsx
│   └── SectionTitle.tsx
├── contexts/            # Estado global leve (Context API + localStorage)
│   ├── CartContext.tsx
│   └── FavoritesContext.tsx
├── data/
│   └── mockData.ts      # Catálogo, categorias, marcas e helpers
├── routes/              # File-based routing (TanStack Router)
│   ├── __root.tsx       # Shell + Providers + 404 global
│   ├── index.tsx        # /
│   ├── category.$slug.tsx   # /category/:slug
│   ├── product.$id.tsx      # /product/:id
│   ├── search.tsx           # /search?q=...
│   └── cart.tsx             # /cart
├── types/
│   └── product.ts
└── styles.css           # Tokens da paleta Tactical Dark
```

## Design System

Paleta semântica em `src/styles.css` (oklch). Use tokens via classes Tailwind:

| Token              | Uso                                         |
| ------------------ | ------------------------------------------- |
| `bunker-black`     | Fundo principal                             |
| `bunker-charcoal`  | Cards, headers de seção                     |
| `bunker-graphite`  | Bordas, divisores, hover                    |
| `bunker-tan`       | CTA primário, preços, links ativos          |
| `bunker-tan-dark`  | Hover do Tan                                |
| `bunker-military`  | Badges promocionais, selos                  |
| `bunker-danger`    | Badges de desconto alto, alertas            |
| `bunker-text-*`    | Tipografia primária / secundária            |

Fontes: **Oswald** (display/títulos) + **Inter** (corpo) via Google Fonts.

## Trocando o mockData pelo Supabase no futuro

Toda a camada de dados está centralizada em `src/data/mockData.ts` e exposta por funções puras:

```ts
getProductById(id)
getProductsByCategory(slug)
searchProducts(query)
getFeaturedProducts()
getPromoProducts()
getGearProducts()
getCategoryBySlug(slug)
```

Para migrar para Supabase:

1. Mantenha as **interfaces** em `src/types/product.ts` como contrato.
2. Crie um cliente Supabase (`src/lib/supabase.ts`).
3. Reescreva cada função de `mockData.ts` para retornar `Promise<Product[]>` consultando a tabela `products`.
4. Em cada rota/componente que consome essas funções, troque a chamada síncrona por `useEffect`/`useQuery` (TanStack Query é a escolha natural já que TanStack Router está no projeto).
5. Os contexts `CartContext` e `FavoritesContext` continuam locais (localStorage) — basta sincronizar com a tabela do usuário autenticado.

Nada além de `src/data/mockData.ts` precisa ser tocado para a troca.

## Scripts

```bash
npm run dev      # dev server
npm run build    # build de produção
npm run preview  # preview do build
```
