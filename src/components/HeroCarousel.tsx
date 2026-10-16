import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/data/hero-slides";
import { cn } from "@/lib/utils";

export const HERO_AUTOPLAY_MS = 6000;

function SlideTitle({ slide, as: Tag }: { slide: HeroSlide; as: "h1" | "h2" }) {
  const parts = slide.highlight ? slide.title.split(slide.highlight) : [slide.title];
  return (
    <Tag className="font-display uppercase text-bunker-text-primary text-4xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-wider">
      {parts.length === 2 ? (
        <>
          {parts[0]}
          <span className="text-bunker-tan">{slide.highlight}</span>
          {parts[1]}
        </>
      ) : (
        slide.title
      )}
    </Tag>
  );
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  // Advance on its own, except while the visitor hovers/focuses it, the tab is
  // hidden, or the system asks for reduced motion.
  useEffect(() => {
    if (!emblaApi || paused || slides.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") emblaApi.scrollNext();
    }, HERO_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [emblaApi, paused, slides.length, selected]);

  return (
    <section
      className="relative bg-bunker-black"
      aria-roledescription="carousel"
      aria-label="Destaques da Bunker 81"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) =>
            slide.art ? (
              <div
                key={slide.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${slides.length}: ${slide.art.alt}`}
                aria-hidden={index !== selected}
              >
                {index === 0 && <h1 className="sr-only">{slide.title}</h1>}
                <Link
                  to="/category/$slug"
                  params={{ slug: slide.categoryHandle }}
                  tabIndex={index === selected ? 0 : -1}
                  className="block"
                >
                  <picture>
                    {slide.art.mobile && (
                      <source media="(max-width: 767px)" srcSet={slide.art.mobile} />
                    )}
                    <img
                      src={slide.art.desktop}
                      alt={slide.art.alt}
                      width={1920}
                      height={640}
                      className="block w-full h-auto"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </picture>
                </Link>
              </div>
            ) : (
              <div
                key={slide.id}
                className="relative min-w-0 shrink-0 grow-0 basis-full min-h-[70vh] md:min-h-[80vh] flex items-center"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${slides.length}: ${slide.title}`}
                aria-hidden={index !== selected}
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.2) 100%), url(${slide.background})`,
                  backgroundSize: "cover",
                  backgroundPosition: slide.position ?? "center",
                }}
              >
                {slide.figure && (
                  <img
                    src={slide.figure}
                    alt=""
                    className="pointer-events-none absolute bottom-0 right-[4%] hidden md:block h-[85%] max-w-[45%] object-contain object-bottom"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                )}
                <div className="relative max-w-[1400px] mx-auto px-4 py-20 w-full">
                  <div className="max-w-2xl">
                    <p
                      className="text-bunker-military-light font-display uppercase tracking-widest text-xl sm:text-3xl md:text-4xl mb-6"
                      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}
                    >
                      {slide.eyebrow}
                    </p>
                    <SlideTitle slide={slide} as={index === 0 ? "h1" : "h2"} />
                    <p className="mt-5 text-base md:text-lg text-bunker-text-secondary max-w-xl">
                      {slide.description}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link
                        to="/category/$slug"
                        params={{ slug: slide.categoryHandle }}
                        tabIndex={index === selected ? 0 : -1}
                        className="inline-flex items-center justify-center bg-bunker-tan text-bunker-black uppercase font-bold tracking-wider text-sm px-6 py-3 rounded-sm hover:bg-bunker-tan-dark transition-colors"
                      >
                        {slide.cta}
                      </Link>
                      <a
                        href="#catalogo"
                        tabIndex={index === selected ? 0 : -1}
                        className="inline-flex items-center justify-center border border-bunker-tan text-bunker-tan uppercase font-bold tracking-wider text-sm px-6 py-3 rounded-sm hover:bg-bunker-tan/10 transition-colors"
                      >
                        Ver Catálogo
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Destaque anterior"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-bunker-black/60 text-bunker-text-primary border border-bunker-graphite hover:border-bunker-tan hover:text-bunker-tan transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Próximo destaque"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-bunker-black/60 text-bunker-text-primary border border-bunker-graphite hover:border-bunker-tan hover:text-bunker-tan transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`Ir para o destaque ${index + 1}`}
                aria-current={index === selected}
                className={cn(
                  "h-2.5 rounded-full transition-all",
                  index === selected
                    ? "w-8 bg-bunker-tan"
                    : "w-2.5 bg-bunker-text-secondary/60 hover:bg-bunker-text-primary",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
