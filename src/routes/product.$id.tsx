import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ChevronUp, Minus, Plus } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PriceTag } from "@/components/PriceTag";
import { BunkerBadge } from "@/components/BunkerBadge";
import { ProductCarousel } from "@/components/ProductCarousel";
import { SectionTitle } from "@/components/SectionTitle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProduct,
  useProductsByCategory,
  useCategories,
  type ProductVariantDetail,
} from "@/hooks/useMedusaProducts";
import {
  buildOptionSelectors,
  canSelectByOptions,
  displayBrand,
  findVariantForSelection,
  galleryForSelection,
  initialOptionSelection,
  resolveSelectedVariant,
  selectOptionValue,
  type OptionSelection,
} from "@/lib/catalog";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SafeProductImage } from "@/components/SafeProductImage";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Produto — Bunker 81 Airsoft" },
      { name: "description", content: "Detalhes do produto na Bunker 81 Airsoft." },
    ],
  }),
  component: ProductPage,
});

type Tab = "desc" | "specs" | "reviews";

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const { data: categories } = useCategories();
  const relatedCategoryIds = useMemo(
    () => product?.categoryIds?.slice(0, 1) ?? [],
    [product?.categoryIds],
  );
  const relatedQuery = useProductsByCategory(relatedCategoryIds, 9);
  const { addItem, isPending } = useCart();

  const [mainImage, setMainImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("desc");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [chosenOptions, setChosenOptions] = useState<OptionSelection>({});
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const [canScrollThumbsUp, setCanScrollThumbsUp] = useState(false);
  const [canScrollThumbsDown, setCanScrollThumbsDown] = useState(false);

  function syncThumbArrows(el: HTMLDivElement | null) {
    if (!el) return;
    setCanScrollThumbsUp(el.scrollTop > 0);
    setCanScrollThumbsDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  // The thumbnail strip turns vertical at md, so re-check the arrows when the window changes size.
  useEffect(() => {
    const onResize = () => syncThumbArrows(thumbsRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setMainImage(0);
    setQty(1);
    setSelectedVariantId(null);
    setChosenOptions({});
  }, [id]);

  const category = useMemo(
    () => categories?.find((c) => c.slug === product?.category),
    [categories, product?.category],
  );

  const related = useMemo(
    () => (relatedQuery.data ?? []).filter((p) => p.id !== product?.id).slice(0, 8),
    [relatedQuery.data, product?.id],
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">
          <Skeleton className="h-4 w-64 mb-6 bg-bunker-graphite-light/60" />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] gap-8 lg:gap-10">
            <Skeleton className="aspect-square w-full bg-bunker-graphite-light/60" />
            <div className="flex flex-col gap-4">
              <Skeleton className="h-3 w-32 bg-bunker-graphite-light/60" />
              <Skeleton className="h-10 w-full bg-bunker-graphite-light/60" />
              <Skeleton className="h-24 w-full bg-bunker-graphite-light/60" />
              <Skeleton className="h-10 w-40 bg-bunker-graphite-light/60" />
              <Skeleton className="h-12 w-full bg-bunker-graphite-light/60" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl uppercase tracking-wider">
            Não foi possível carregar o produto
          </h1>
          <p className="mt-3 text-sm text-bunker-text-secondary">
            Verifique sua conexão e tente novamente. Seu carrinho não foi alterado.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 border border-bunker-tan px-5 py-2 text-xs font-bold uppercase tracking-wider text-bunker-tan transition-colors hover:bg-bunker-tan/10"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  if (!product) {
    throw notFound();
  }

  // Products whose variants are set up with options ("Cor", "Tamanho") get one
  // picker per option; anything else keeps the plain list of variants.
  const selectByOptions = canSelectByOptions(product.options, product.variants);
  const optionSelection: OptionSelection = selectByOptions
    ? {
        ...initialOptionSelection(
          buildOptionSelectors(product.options, product.variants, chosenOptions),
        ),
        ...chosenOptions,
      }
    : {};
  const optionSelectors = selectByOptions
    ? buildOptionSelectors(product.options, product.variants, optionSelection)
    : [];
  const selectedVariant = selectByOptions
    ? findVariantForSelection(product.options, product.variants, optionSelection)
    : resolveSelectedVariant(product.variants, selectedVariantId);
  const gallery = galleryForSelection(
    product.images,
    product.variants,
    selectedVariant,
    optionSelection,
  );
  const shownImage = Math.min(mainImage, gallery.length - 1);

  // One page = 4 thumbnails (80px + 8px gap), so the last one of the old page stays visible.
  function scrollThumbs(direction: 1 | -1) {
    thumbsRef.current?.scrollBy({ top: direction * 4 * 88, behavior: "smooth" });
  }
  const displayedPrice = selectedVariant?.currentPrice ?? product.currentPrice;
  const displayedOriginalPrice = selectedVariant?.originalPrice ?? product.price1;
  const priceAvailable = selectedVariant?.priceAvailable ?? product.priceAvailable;
  const discountPercent =
    priceAvailable && displayedOriginalPrice > displayedPrice
      ? Math.round(((displayedOriginalPrice - displayedPrice) / displayedOriginalPrice) * 100)
      : 0;
  const isPromo = discountPercent > 0;
  const canPurchase = Boolean(selectedVariant?.isAvailable && selectedVariant.priceAvailable);
  const maxQuantity =
    selectedVariant?.stock !== null && !selectedVariant?.allowBackorder
      ? selectedVariant?.stock
      : undefined;
  const availabilityLabel = getAvailabilityLabel(selectedVariant, product.variants.length > 1);

  const handleAddToCart = async (goToCart: boolean) => {
    if (!selectedVariant) {
      toast.error("Escolha as opções antes de continuar.");
      return;
    }

    if (!canPurchase) return;

    try {
      await addItem(selectedVariant.id, qty);
      toast.success("Adicionado ao carrinho", {
        description: `${qty}x ${product.name} — ${getVariantLabel(selectedVariant, 0)}`,
      });
      if (goToCart) {
        await navigate({ to: "/cart" });
      }
    } catch {
      // CartContext presents the actionable error to the customer.
    }
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:py-10">
        <nav className="flex items-center gap-1 text-xs text-bunker-text-secondary mb-6 flex-wrap">
          <Link to="/" className="hover:text-bunker-tan">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          {category && (
            <>
              <Link
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="hover:text-bunker-tan uppercase tracking-wider"
              >
                {category.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-bunker-tan line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] gap-8 lg:gap-10">
          {/* Gallery */}
          <div className="flex flex-col-reverse md:flex-row md:items-start gap-3">
            <div className="relative shrink-0">
              {/* Desktop shows 5 thumbnails (5 × 80px + 4 × 8px gap); the arrows page through the rest. */}
              <div
                ref={(el) => {
                  thumbsRef.current = el;
                  syncThumbArrows(el);
                }}
                onScroll={(e) => syncThumbArrows(e.currentTarget)}
                className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto md:max-h-[432px] md:snap-y md:snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {gallery.length > 1 &&
                  gallery.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setMainImage(i)}
                      aria-pressed={i === shownImage}
                      className={cn(
                        "product-stage shrink-0 snap-start w-16 h-16 md:w-20 md:h-20 border-2 rounded-sm overflow-hidden transition-colors",
                        i === shownImage
                          ? "border-bunker-tan"
                          : "border-bunker-graphite-light hover:border-bunker-gold",
                      )}
                      aria-label={`Foto ${i + 1} de ${gallery.length}`}
                    >
                      <SafeProductImage
                        src={src}
                        alt=""
                        loading="lazy"
                        className="product-stage-image p-1"
                      />
                    </button>
                  ))}
              </div>
              {canScrollThumbsUp && (
                <button
                  type="button"
                  onClick={() => scrollThumbs(-1)}
                  aria-label="Fotos anteriores"
                  className="hidden md:flex absolute top-0 inset-x-0 h-8 items-center justify-center bg-bunker-black/80 text-bunker-tan hover:text-bunker-gold rounded-t-sm transition-colors"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              )}
              {canScrollThumbsDown && (
                <button
                  type="button"
                  onClick={() => scrollThumbs(1)}
                  aria-label="Mais fotos"
                  className="hidden md:flex absolute bottom-0 inset-x-0 h-8 items-center justify-center bg-bunker-black/80 text-bunker-tan hover:text-bunker-gold rounded-b-sm transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="product-stage relative flex-1 aspect-square border border-bunker-graphite-light rounded-sm overflow-hidden">
              <SafeProductImage
                src={gallery[shownImage]}
                alt={
                  selectedVariant && product.variants.length > 1
                    ? `${product.name} — ${getVariantLabel(selectedVariant, 0)}`
                    : product.name
                }
                className="product-stage-image p-4 md:p-6"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {discountPercent >= 10 && (
                  <BunkerBadge variant="danger">-{discountPercent}%</BunkerBadge>
                )}
                {isPromo && <BunkerBadge variant="promo">Promo</BunkerBadge>}
                {product.isNew && <BunkerBadge variant="new">Novo</BunkerBadge>}
                {selectedVariant && !selectedVariant.isAvailable && (
                  <BunkerBadge variant="danger">Indisponível</BunkerBadge>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest text-bunker-text-secondary">
              {displayBrand(product)}
              {selectedVariant?.sku
                ? ` · SKU ${selectedVariant.sku}`
                : product.variants.length > 1
                  ? " · Escolha as opções para consultar o SKU"
                  : " · SKU não informado"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wider leading-tight">
              {product.name}
            </h1>
            {optionSelectors.map((selector) =>
              selector.values.length < 2 ? null : (
                <fieldset
                  key={selector.id}
                  className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-4"
                >
                  <legend className="px-1 text-xs uppercase font-bold tracking-wider text-bunker-text-primary">
                    {selector.title}
                    {optionSelection[selector.id] && (
                      <span className="ml-2 normal-case font-semibold tracking-normal text-bunker-gold">
                        {optionSelection[selector.id]}
                      </span>
                    )}
                  </legend>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selector.values.map(({ value, purchasable }) => {
                      const active = optionSelection[selector.id] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={active}
                          aria-label={purchasable ? value : `${value} (indisponível)`}
                          onClick={() => {
                            setChosenOptions(
                              selectOptionValue(
                                product.variants,
                                optionSelection,
                                selector.id,
                                value,
                              ),
                            );
                            setMainImage(0);
                            setQty(1);
                          }}
                          className={cn(
                            "min-w-[3rem] rounded-sm border-2 px-3 py-2 text-sm font-semibold transition-colors",
                            active
                              ? "border-bunker-tan bg-bunker-tan text-bunker-black"
                              : "border-bunker-graphite-light text-bunker-text-primary hover:border-bunker-gold hover:text-bunker-gold",
                            !purchasable && "opacity-60 line-through decoration-1",
                          )}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ),
            )}

            {!selectByOptions && product.variants.length > 1 && (
              <fieldset className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-4">
                <legend className="px-1 text-xs uppercase font-bold tracking-wider text-bunker-text-primary">
                  Escolha as opções
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {product.variants.map((variant, index) => (
                    <button
                      key={variant.id}
                      type="button"
                      aria-pressed={selectedVariantId === variant.id}
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setMainImage(0);
                        setQty(1);
                      }}
                      className={cn(
                        "rounded-sm border px-3 py-2.5 text-left transition-colors",
                        selectedVariantId === variant.id
                          ? "border-bunker-tan bg-bunker-tan/10"
                          : "border-bunker-graphite-light hover:border-bunker-gold",
                        (!variant.isAvailable || !variant.priceAvailable) && "opacity-60",
                      )}
                    >
                      <span className="block text-sm font-semibold text-bunker-text-primary">
                        {getVariantLabel(variant, index)}
                      </span>
                      <span className="block text-xs text-bunker-text-secondary mt-1">
                        {!variant.priceAvailable
                          ? "Preço indisponível"
                          : getAvailabilityLabel(variant, false)}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="bg-bunker-charcoal border border-bunker-graphite rounded-sm p-5 mt-2">
              {priceAvailable ? (
                <PriceTag
                  price={displayedPrice}
                  originalPrice={discountPercent > 0 ? displayedOriginalPrice : undefined}
                  prefix={
                    !selectedVariant && product.variants.length > 1 ? "A partir de" : undefined
                  }
                  size="lg"
                />
              ) : (
                <p className="text-lg font-semibold text-bunker-text-secondary">
                  Preço indisponível
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-bunker-graphite-light rounded-sm">
                <button
                  type="button"
                  disabled={!canPurchase}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-bunker-tan hover:bg-bunker-graphite-light disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 tabular-nums w-10 text-center">{qty}</span>
                <button
                  type="button"
                  disabled={!canPurchase || (maxQuantity !== undefined && qty >= maxQuantity)}
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 text-bunker-tan hover:bg-bunker-graphite-light disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-bunker-text-secondary">{availabilityLabel}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isPending || !canPurchase}
                onClick={() => void handleAddToCart(false)}
                className="flex-1 bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-sm py-3.5 rounded-sm hover:bg-bunker-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!selectedVariant && product.variants.length > 1
                  ? "Escolha as opções"
                  : !selectedVariant?.isAvailable
                    ? "Indisponível"
                    : !selectedVariant.priceAvailable
                      ? "Preço indisponível"
                      : "Adicionar ao Carrinho"}
              </button>
              <button
                type="button"
                disabled={isPending || !canPurchase}
                onClick={() => void handleAddToCart(true)}
                className={cn(
                  "flex-1 text-center border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-sm py-3.5 rounded-sm hover:bg-bunker-tan/10 transition-colors",
                  (isPending || !canPurchase) && "cursor-not-allowed opacity-50",
                )}
              >
                Comprar Agora
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-t border-bunker-graphite">
          <div className="flex gap-1 border-b border-bunker-graphite">
            {(
              [
                ["desc", "Descrição"],
                // ["specs", "Especificações"],
                // ["reviews", "Avaliações"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn(
                  "px-4 md:px-6 py-3 font-display uppercase tracking-wider text-sm transition-colors",
                  tab === k
                    ? "text-bunker-tan border-b-2 border-bunker-tan -mb-px"
                    : "text-bunker-text-secondary hover:text-bunker-text-primary",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="py-6 text-bunker-text-secondary leading-relaxed">
            {tab === "desc" && <p className="max-w-3xl">{product.description}</p>}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <SectionTitle
              title="Produtos Relacionados"
              subtitle="Outros produtos desta categoria"
            />
            <ProductCarousel
              products={related}
              isLoading={relatedQuery.isLoading}
              isError={relatedQuery.isError}
              onRetry={() => void relatedQuery.refetch()}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

function getVariantLabel(variant: ProductVariantDetail, index: number): string {
  const normalizedTitle = variant.title.trim().toLowerCase();
  if (normalizedTitle && normalizedTitle !== "default variant") return variant.title;
  if (variant.sku) return variant.sku;
  return `Variante ${index + 1}`;
}

function getAvailabilityLabel(
  variant: ProductVariantDetail | undefined,
  requiresSelection: boolean,
): string {
  if (!variant) {
    return requiresSelection
      ? "Escolha as opções para consultar a disponibilidade"
      : "Indisponível";
  }
  if (!variant.isAvailable) return "Indisponível";
  if (variant.stock !== null && variant.stock > 0) {
    return `${variant.stock} em estoque`;
  }
  if (variant.allowBackorder) return "Disponível para encomenda";
  return "Disponível";
}
