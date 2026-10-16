import heroBg from "@/assets/hero-bg.jpg";
import coleteDesktop from "@/assets/banners/colete-modular-desktop.webp";
import coleteMobile from "@/assets/banners/colete-modular-mobile.webp";
import shieldDesktop from "@/assets/banners/rossi-shield-desktop.webp";
import shieldMobile from "@/assets/banners/rossi-shield-mobile.webp";
import miraDesktop from "@/assets/banners/mira-rossi-558-desktop.webp";
import miraMobile from "@/assets/banners/mira-rossi-558-mobile.webp";

/** Opening slide drawn by the site: photo background, text and buttons. */
export type PhotoSlide = {
  id: string;
  eyebrow: string;
  title: string;
  /** Word of the title highlighted in tan. */
  highlight?: string;
  description: string;
  cta: string;
  categoryHandle: string;
  background: string;
  /** Optional cut-out shown on the right on larger screens. */
  figure?: string;
  /** CSS background-position for the photo. */
  position?: string;
  art?: undefined;
};

/**
 * Finished banner artwork (text included): desktop 1920×640 (3:1), mobile 1080×1080.
 * The whole banner links to a product or to a category.
 */
export type ArtSlide = {
  id: string;
  title: string;
  art: { desktop: string; mobile?: string; alt: string };
  link: { type: "product"; id: string } | { type: "category"; handle: string };
};

export type HeroSlide = PhotoSlide | ArtSlide;

// Opening slide + artwork approved by Saulo on 16 Oct 2026. New artwork goes in
// src/assets/banners/ and becomes another ArtSlide here.
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "armas-airsoft",
    eyebrow: "Bunker 81 — Onde a missão começa",
    title: "Equipamento tático para sua missão",
    highlight: "tático",
    description: "Pistolas GBB e CO2, rifles elétricos, GBBR, snipers e shotguns de airsoft.",
    cta: "Ver armas airsoft",
    categoryHandle: "armas-airsoft",
    background: heroBg,
    position: "center right",
  },
  {
    id: "colete-tatico-modular",
    title: "Colete tático modular",
    art: {
      desktop: coleteDesktop,
      mobile: coleteMobile,
      alt: "Colete tático modular em quatro cores: verde militar, cáqui, multicam e preto. Conheça a linha.",
    },
    link: { type: "category", handle: "coletes-modulares" },
  },
  {
    id: "rossi-shield",
    title: "Rossi Shield lubrificante e protetor",
    art: {
      desktop: shieldDesktop,
      mobile: shieldMobile,
      alt: "Cuidado que acompanha o jogo. Rossi Shield, lubrificante e protetor. Ver produto.",
    },
    link: { type: "product", id: "prod_01M3WFB296PY97KYF7902P2R7W" },
  },
  {
    id: "mira-rossi-558",
    title: "Mira holográfica Rossi 558",
    art: {
      desktop: miraDesktop,
      mobile: miraMobile,
      alt: "Mira holográfica Rossi 558, seu próximo upgrade para o airsoft. Ver produto.",
    },
    link: { type: "product", id: "prod_01KW4KQ8MFG929EJA1BANDTBYK" },
  },
];
