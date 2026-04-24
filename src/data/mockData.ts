import type { Product, Category } from "@/types/product";

export const categories: Category[] = [
  {
    slug: "airsoft",
    name: "Airsoft",
    icon: "Crosshair",
    subcategories: [
      { slug: "rifles-eletricos", name: "Rifles Elétricos" },
      { slug: "rifles-gbb", name: "Rifles GBB" },
      { slug: "pistolas", name: "Pistolas" },
      { slug: "bbs-e-gas", name: "BBs e Gás" },
      { slug: "magazines", name: "Magazines" },
    ],
  },
  {
    slug: "armas-de-pressao",
    name: "Armas de Pressão",
    icon: "Target",
    subcategories: [
      { slug: "carabinas", name: "Carabinas" },
      { slug: "pistolas", name: "Pistolas" },
      { slug: "chumbinhos", name: "Chumbinhos" },
      { slug: "co2", name: "CO2" },
    ],
  },
  {
    slug: "acessorios-taticos",
    name: "Acessórios Táticos",
    icon: "Shield",
    subcategories: [
      { slug: "coletes", name: "Coletes" },
      { slug: "coldres", name: "Coldres" },
      { slug: "mochilas", name: "Mochilas" },
      { slug: "lanternas", name: "Lanternas" },
      { slug: "miras-red-dots", name: "Miras e Red Dots" },
    ],
  },
  {
    slug: "cutelaria",
    name: "Cutelaria",
    icon: "Swords",
    subcategories: [
      { slug: "facas-taticas", name: "Facas Táticas" },
      { slug: "canivetes", name: "Canivetes" },
      { slug: "machados", name: "Machados" },
      { slug: "multitools", name: "Multitools" },
    ],
  },
  {
    slug: "camping",
    name: "Camping",
    icon: "Tent",
    subcategories: [
      { slug: "barracas", name: "Barracas" },
      { slug: "lanternas", name: "Lanternas" },
      { slug: "cantis", name: "Cantis" },
      { slug: "cozinha-de-campo", name: "Cozinha de Campo" },
    ],
  },
];

export const brands: string[] = [
  "ARES",
  "Cyma",
  "G&G",
  "VFC",
  "Tokyo Marui",
  "Crosman",
  "Gamo",
  "Invicta",
  "Nautika",
  "Guepardo",
];

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=900&q=80`;

const calcDiscount = (original: number, current: number) =>
  Math.round(((original - current) / original) * 100);

const mk = (
  base: Omit<Product, "discountPercent" | "slug">,
): Product => ({
  ...base,
  slug: base.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, ""),
  discountPercent:
    base.currentPrice < base.price1 ? calcDiscount(base.price1, base.currentPrice) : 0,
});

export const products: Product[] = [
  // ===== AIRSOFT =====
  mk({
    id: "p001",
    name: "Rifle de Airsoft AEG M4 CQB Tático",
    category: "airsoft",
    subcategory: "rifles-eletricos",
    brand: "G&G",
    sku: "GG-M4-CQB-001",
    images: [
      img("photo-1595590424283-b8f17842773f"),
      img("photo-1567361808960-dec9cb578182"),
      img("photo-1584967918942-2ee9b1adf467"),
    ],
    description:
      "Rifle elétrico AEG calibre 6mm com gearbox V2 reforçada, hop-up regulável e trilho picatinny full length. Ideal para operações CQB e jogos de campo aberto. Velocidade média 360 FPS com BB 0.20g.",
    specs: {
      Calibre: "6mm",
      "Velocidade (FPS)": "360",
      Sistema: "AEG - Elétrico",
      Gearbox: "V2 reforçada",
      "Capacidade do magazine": "300 BBs",
      Material: "Polímero reforçado + Metal",
    },
    costPrice: 1100,
    price1: 1899,
    price2: 1750,
    price3: 1599,
    currentPrice: 1599,
    stock: 12,
    isNew: false,
    isPromo: true,
    rating: 4.7,
    reviewsCount: 128,
  }),
  mk({
    id: "p002",
    name: "Rifle Airsoft GBB AK-47 Full Metal",
    category: "airsoft",
    subcategory: "rifles-gbb",
    brand: "VFC",
    sku: "VFC-AK47-GBB",
    images: [
      img("photo-1568438350562-2cae6d394ad0"),
      img("photo-1584967918942-2ee9b1adf467"),
    ],
    description:
      "Rifle GBB (Gas Blow Back) full metal com sistema de recuo realista, blowback potente e magazine de gás de alta capacidade. Acabamento militar autêntico com madeira sintética.",
    specs: {
      Calibre: "6mm",
      "Velocidade (FPS)": "390",
      Sistema: "GBB - Gás Verde",
      Material: "Aço + Madeira sintética",
      Peso: "3.4kg",
    },
    costPrice: 2400,
    price1: 4200,
    price2: 4000,
    price3: 3799,
    currentPrice: 3799,
    stock: 4,
    isNew: true,
    isPromo: true,
    rating: 4.9,
    reviewsCount: 47,
  }),
  mk({
    id: "p003",
    name: "Pistola Airsoft Glock 17 GBB",
    category: "airsoft",
    subcategory: "pistolas",
    brand: "Tokyo Marui",
    sku: "TM-G17-GBB",
    images: [img("photo-1584208632869-05fa2b2a5934"), img("photo-1595590424283-b8f17842773f")],
    description:
      "Réplica oficial Tokyo Marui da Glock 17 com sistema GBB, slide metálico, trigger crisp e recuo realista. Magazine de gás incluso com capacidade de 25 BBs.",
    specs: {
      Calibre: "6mm",
      "Velocidade (FPS)": "300",
      Sistema: "GBB - Gás Verde",
      "Capacidade do magazine": "25 BBs",
      Material: "Polímero + Metal",
    },
    costPrice: 850,
    price1: 1499,
    price2: 1399,
    price3: 1299,
    currentPrice: 1299,
    stock: 18,
    isNew: false,
    isPromo: true,
    rating: 4.8,
    reviewsCount: 203,
  }),
  mk({
    id: "p004",
    name: "BBs Premium 0.25g Pote 4000un Branca",
    category: "airsoft",
    subcategory: "bbs-e-gas",
    brand: "ARES",
    sku: "ARES-BB-025-4000",
    images: [img("photo-1611024944203-79e2eb12fde2")],
    description:
      "Munição BB 6mm 0.25g de alta precisão, fabricada com polímero polido sem rebarbas. Peso ideal para hop-up calibrado, garantindo trajetória estável e maior alcance.",
    specs: {
      Diâmetro: "6mm",
      Peso: "0.25g",
      Quantidade: "4000 unidades",
      Cor: "Branca",
      Tipo: "Polímero biodegradável",
    },
    costPrice: 45,
    price1: 119,
    price2: 99,
    price3: 89,
    currentPrice: 89,
    stock: 230,
    isNew: false,
    isPromo: true,
    rating: 4.6,
    reviewsCount: 512,
  }),

  // ===== ARMAS DE PRESSÃO =====
  mk({
    id: "p005",
    name: "Carabina de Pressão 5.5mm Nitro Piston",
    category: "armas-de-pressao",
    subcategory: "carabinas",
    brand: "Crosman",
    sku: "CRS-NP-55",
    images: [img("photo-1576037794708-9f0e29c44e7e"), img("photo-1567361808960-dec9cb578182")],
    description:
      "Carabina de pressão calibre 5.5mm com sistema Nitro Piston, mais silencioso e durável que molas convencionais. Acompanha luneta 4x32 e trilho 11mm.",
    specs: {
      Calibre: "5.5mm",
      "Velocidade (FPS)": "950",
      Sistema: "Nitro Piston",
      "Luneta inclusa": "4x32",
      Cano: "Estriado",
    },
    costPrice: 950,
    price1: 1799,
    price2: 1699,
    price3: 1499,
    currentPrice: 1499,
    stock: 7,
    isNew: false,
    isPromo: true,
    rating: 4.5,
    reviewsCount: 89,
  }),
  mk({
    id: "p006",
    name: "Pistola de Pressão CO2 4.5mm Multi-tiro",
    category: "armas-de-pressao",
    subcategory: "pistolas",
    brand: "Gamo",
    sku: "GAMO-CO2-PT85",
    images: [img("photo-1584208632869-05fa2b2a5934")],
    description:
      "Pistola CO2 calibre 4.5mm com magazine rotativo de 8 tiros, trigger duplo single/double action. Acabamento metálico com pegada ergonômica.",
    specs: {
      Calibre: "4.5mm",
      "Velocidade (FPS)": "450",
      Sistema: "CO2",
      Capacidade: "8 chumbinhos",
      Material: "Metal + Polímero",
    },
    costPrice: 480,
    price1: 899,
    price2: 849,
    price3: 799,
    currentPrice: 899,
    stock: 22,
    isNew: true,
    isPromo: false,
    rating: 4.4,
    reviewsCount: 67,
  }),
  mk({
    id: "p007",
    name: "Chumbinho 5.5mm Match Pesado Lata 250un",
    category: "armas-de-pressao",
    subcategory: "chumbinhos",
    brand: "Gamo",
    sku: "GAMO-CHB-55-250",
    images: [img("photo-1611024944203-79e2eb12fde2")],
    description:
      "Chumbinhos calibre 5.5mm de competição, formato diabolô para máxima precisão em tiro alvo. Liga de chumbo macio para deformação controlada.",
    specs: {
      Calibre: "5.5mm",
      Peso: "1.0g",
      Quantidade: "250 unidades",
      Formato: "Diabolô",
      Uso: "Tiro alvo / Match",
    },
    costPrice: 32,
    price1: 79,
    price2: 69,
    price3: 59,
    currentPrice: 79,
    stock: 145,
    isNew: false,
    isPromo: false,
    rating: 4.7,
    reviewsCount: 234,
  }),

  // ===== ACESSÓRIOS TÁTICOS =====
  mk({
    id: "p008",
    name: "Colete Tático Plate Carrier MOLLE Multicam",
    category: "acessorios-taticos",
    subcategory: "coletes",
    brand: "Invicta",
    sku: "INV-PC-MC-01",
    images: [img("photo-1595241634564-13ee87815bdb"), img("photo-1556139830-eb5b8c5f4cab")],
    description:
      "Colete plate carrier com sistema MOLLE completo frontal, traseiro e laterais. Compatível com placas balísticas SAPI. Padrão Multicam autêntico, costura reforçada e ajustes em velcro.",
    specs: {
      Padrão: "Multicam",
      Sistema: "MOLLE / PALS",
      Tamanho: "Ajustável M ao GG",
      "Compatibilidade placas": "SAPI / ESAPI",
      Material: "Cordura 1000D",
    },
    costPrice: 380,
    price1: 749,
    price2: 699,
    price3: 599,
    currentPrice: 599,
    stock: 15,
    isNew: false,
    isPromo: true,
    rating: 4.8,
    reviewsCount: 156,
  }),
  mk({
    id: "p009",
    name: "Red Dot Holográfico T1 Trilho 20mm",
    category: "acessorios-taticos",
    subcategory: "miras-red-dots",
    brand: "ARES",
    sku: "ARES-RD-T1",
    images: [img("photo-1584967918942-2ee9b1adf467")],
    description:
      "Mira red dot estilo T1 com retículo 2 MOA, ajustes de elevação e windage por click. Montagem em trilho picatinny 20mm. Brilho ajustável em 11 níveis, à prova d'água.",
    specs: {
      Retículo: "Ponto vermelho 2 MOA",
      "Trilho compatível": "Picatinny 20mm",
      "Níveis de brilho": "11",
      Bateria: "CR2032 (inclusa)",
      Material: "Alumínio aeronáutico",
    },
    costPrice: 220,
    price1: 489,
    price2: 449,
    price3: 389,
    currentPrice: 389,
    stock: 32,
    isNew: true,
    isPromo: true,
    rating: 4.6,
    reviewsCount: 98,
  }),
  mk({
    id: "p010",
    name: "Lanterna Tática LED 1200 Lúmens Recarregável",
    category: "acessorios-taticos",
    subcategory: "lanternas",
    brand: "Nautika",
    sku: "NTK-LT-1200",
    images: [img("photo-1568438350562-2cae6d394ad0")],
    description:
      "Lanterna tática de mão com 1200 lúmens reais, 5 modos de operação incluindo strobe defensivo. Bateria 18650 recarregável via USB-C, corpo em alumínio aeronáutico.",
    specs: {
      "Lúmens": "1200",
      Alcance: "300m",
      Modos: "5 (alto, médio, baixo, strobe, SOS)",
      Bateria: "18650 recarregável",
      Material: "Alumínio T6",
    },
    costPrice: 95,
    price1: 249,
    price2: 219,
    price3: 199,
    currentPrice: 199,
    stock: 48,
    isNew: false,
    isPromo: true,
    rating: 4.5,
    reviewsCount: 312,
  }),

  // ===== CUTELARIA =====
  mk({
    id: "p011",
    name: "Faca Tática de Combate Lâmina Fixa 12pol",
    category: "cutelaria",
    subcategory: "facas-taticas",
    brand: "Invicta",
    sku: "INV-FT-12",
    images: [img("photo-1593618998160-e34014e67546")],
    description:
      "Faca tática lâmina fixa em aço inox 440C com tratamento térmico, cabo em G10 antiderrapante. Bainha kydex com clip MOLLE para portar no colete ou cinto.",
    specs: {
      "Comprimento total": "30cm",
      "Lâmina": "17cm aço 440C",
      Cabo: "G10",
      Bainha: "Kydex com clip MOLLE",
      Peso: "320g",
    },
    costPrice: 180,
    price1: 449,
    price2: 419,
    price3: 379,
    currentPrice: 449,
    stock: 19,
    isNew: false,
    isPromo: false,
    rating: 4.7,
    reviewsCount: 87,
  }),
  mk({
    id: "p012",
    name: "Multitool Tático 18 Funções com Estojo",
    category: "cutelaria",
    subcategory: "multitools",
    brand: "Invicta",
    sku: "INV-MT-18",
    images: [img("photo-1530124566582-a618bc2615dc")],
    description:
      "Ferramenta multifuncional com 18 funções incluindo alicate, chaves, lâmina serrilhada, abridor, lima e furador. Construção em aço inox com estojo nylon.",
    specs: {
      Funções: "18",
      Material: "Aço inox 420",
      Comprimento: "10cm fechada",
      Peso: "240g",
      Estojo: "Nylon balístico incluso",
    },
    costPrice: 60,
    price1: 169,
    price2: 149,
    price3: 129,
    currentPrice: 129,
    stock: 56,
    isNew: true,
    isPromo: true,
    rating: 4.4,
    reviewsCount: 174,
  }),

  // ===== CAMPING =====
  mk({
    id: "p013",
    name: "Barraca Tática 4 Pessoas Camuflada",
    category: "camping",
    subcategory: "barracas",
    brand: "Guepardo",
    sku: "GPD-BR4-CAM",
    images: [img("photo-1504280390367-361c6d9f38f4"), img("photo-1487730116645-74489c95b41b")],
    description:
      "Barraca de campanha para 4 pessoas em padrão camuflado. Coluna d'água 2000mm, sobreteto removível, mosquiteiro nas portas e janelas. Montagem rápida em 5 minutos.",
    specs: {
      Capacidade: "4 pessoas",
      "Coluna d'água": "2000mm",
      Dimensões: "240 x 220 x 130cm",
      Peso: "4.2kg",
      Tempo: "Montagem 5 min",
    },
    costPrice: 420,
    price1: 899,
    price2: 829,
    price3: 749,
    currentPrice: 749,
    stock: 11,
    isNew: false,
    isPromo: true,
    rating: 4.6,
    reviewsCount: 142,
  }),
  mk({
    id: "p014",
    name: "Lanterna de Cabeça LED 800 Lúmens",
    category: "camping",
    subcategory: "lanternas",
    brand: "Nautika",
    sku: "NTK-HL-800",
    images: [img("photo-1532635241-17e820acc59f")],
    description:
      "Lanterna de cabeça com 800 lúmens, foco ajustável e luz vermelha auxiliar para preservação da visão noturna. Bateria recarregável USB e ajuste elástico confortável.",
    specs: {
      "Lúmens": "800",
      "Luz auxiliar": "Vermelha",
      Bateria: "Recarregável USB",
      Autonomia: "Até 8h",
      Resistência: "IPX5",
    },
    costPrice: 65,
    price1: 159,
    price2: 139,
    price3: 119,
    currentPrice: 159,
    stock: 73,
    isNew: false,
    isPromo: false,
    rating: 4.5,
    reviewsCount: 98,
  }),
  mk({
    id: "p015",
    name: "Mochila Tática 45L MOLLE Hidratação",
    category: "acessorios-taticos",
    subcategory: "mochilas",
    brand: "Invicta",
    sku: "INV-MC-45L",
    images: [img("photo-1622260614153-03223fb72052")],
    description:
      "Mochila tática 45 litros com sistema MOLLE completo, compartimento para reservatório de hidratação 3L, cinta peitoral e abdominal acolchoadas. Padrão coiote.",
    specs: {
      Capacidade: "45 litros",
      Compartimentos: "3 principais + 4 externos",
      Hidratação: "Compatível 3L",
      Material: "Cordura 600D impermeável",
      Cor: "Coyote",
    },
    costPrice: 220,
    price1: 549,
    price2: 499,
    price3: 449,
    currentPrice: 449,
    stock: 26,
    isNew: true,
    isPromo: true,
    rating: 4.7,
    reviewsCount: 211,
  }),
  mk({
    id: "p016",
    name: "Magazine Mid-Cap M4 140 BBs Kit 5un",
    category: "airsoft",
    subcategory: "magazines",
    brand: "Cyma",
    sku: "CYMA-MAG-M4-5",
    images: [img("photo-1595590424283-b8f17842773f")],
    description:
      "Kit com 5 magazines mid-cap para M4/M16 AEG, capacidade 140 BBs cada. Corpo em polímero reforçado com lábios metálicos. Compatível com a maioria das réplicas AEG.",
    specs: {
      Capacidade: "140 BBs cada",
      Quantidade: "5 unidades",
      Compatibilidade: "M4 / M16 AEG",
      Tipo: "Mid-cap",
      Material: "Polímero + Lábio metálico",
    },
    costPrice: 110,
    price1: 269,
    price2: 239,
    price3: 219,
    currentPrice: 219,
    stock: 41,
    isNew: false,
    isPromo: true,
    rating: 4.6,
    reviewsCount: 142,
  }),
];

// ===== Helper functions =====

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const getProductsByCategory = (slug: string): Product[] =>
  products.filter((p) => p.category === slug);

export const searchProducts = (query: string): Product[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q),
  );
};

export const getFeaturedProducts = (): Product[] =>
  products.filter((p) => ["airsoft", "armas-de-pressao"].includes(p.category)).slice(0, 8);

export const getPromoProducts = (): Product[] => products.filter((p) => p.isPromo);

export const getGearProducts = (): Product[] =>
  products.filter((p) =>
    ["acessorios-taticos", "cutelaria", "camping"].includes(p.category),
  );

export const getCategoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const formatBRL = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
