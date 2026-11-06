import { createFileRoute } from "@tanstack/react-router";
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/lib/medusa";

const SITE = "https://bunker81.com.br";
const PAGE = 100;

// O sdk guarda o login em sessionStorage e quebra no servidor; aqui basta a API pública.
async function store<T>(path: string): Promise<T> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/${path}`, {
    headers: { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY },
  });
  if (!res.ok) throw new Error(`Medusa ${path}: ${res.status}`);
  return res.json();
}

async function productIds() {
  const ids: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { products, count } = await store<{ products: { id: string }[]; count: number }>(
      `products?fields=id&limit=${PAGE}&offset=${offset}`,
    );
    ids.push(...products.map((p) => p.id));
    if (offset + PAGE >= count) return ids;
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [ids, { product_categories }] = await Promise.all([
          productIds(),
          store<{ product_categories: { handle: string }[] }>(
            "product-categories?fields=handle&limit=1000",
          ),
        ]);
        const paths = [
          "/",
          ...product_categories.map((c) => `/category/${encodeURIComponent(c.handle)}`),
          ...ids.map((id) => `/product/${id}`),
        ];
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          paths.map((p) => `<url><loc>${SITE}${p}</loc></url>`).join("\n") +
          `\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
