import heroBg from "@/assets/hero-bg.jpg";
import bunkerBg from "@/assets/background-header.jpg";
import heroOperator from "@/assets/hero-operator.png";
import mascote from "@/assets/mascote.png";

export type HeroSlide = {
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
};

// Provisional banners (mockup) until the final artwork arrives: replace the
// images and copy here; the carousel itself does not need to change.
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
    id: "airguns-carabinas",
    eyebrow: "Pressão e precisão",
    title: "Airguns e carabinas",
    highlight: "carabinas",
    description: "Carabinas e pistolas de pressão com esferas de aço, para tiro esportivo e caça.",
    cta: "Ver airguns",
    categoryHandle: "airguns-carabinas",
    background: bunkerBg,
    position: "center",
  },
  {
    id: "loadout",
    eyebrow: "Monte seu equipamento",
    title: "Loadout completo do operador",
    highlight: "Loadout",
    description: "Coletes modulares, capacetes, máscaras, óculos, luvas, coldres e mochilas.",
    cta: "Ver loadout",
    categoryHandle: "loadout",
    background: bunkerBg,
    figure: heroOperator,
    position: "center left",
  },
  {
    id: "magazines",
    eyebrow: "Rossi · Specna Arms · PTS",
    title: "Magazines para seu equipamento",
    highlight: "Magazines",
    description: "Magazines organizados por marca para encontrar o modelo certo mais rápido.",
    cta: "Ver magazines",
    categoryHandle: "magazines",
    background: heroBg,
    figure: mascote,
    position: "center left",
  },
  {
    id: "suprimentos",
    eyebrow: "Nunca pare no meio do jogo",
    title: "Suprimentos para a partida",
    highlight: "Suprimentos",
    description: "BBs, gás, baterias, carregadores e speedloaders.",
    cta: "Ver suprimentos",
    categoryHandle: "suprimentos",
    background: bunkerBg,
    position: "center right",
  },
];
