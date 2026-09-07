import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Facebook } from "lucide-react";
import logoShield from "@/assets/logo-shield.png";

export function Footer() {
  return (
    <footer className="bg-bunker-black border-t border-bunker-graphite text-bunker-text-secondary">
      <div className="max-w-[1400px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-4">
            <img src={logoShield} alt="Bunker 81" className="h-16 w-auto" />
          </Link>
          <p className="text-sm leading-relaxed mb-4">
            Bunker 81 Airsoft — arsenal completo para operadores sérios. Airsoft, armas de pressão e
            gear tático de verdade.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="p-2 border border-bunker-graphite rounded-sm hover:border-bunker-tan hover:text-bunker-tan transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="p-2 border border-bunker-graphite rounded-sm hover:border-bunker-tan hover:text-bunker-tan transition-colors"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="p-2 border border-bunker-graphite rounded-sm hover:border-bunker-tan hover:text-bunker-tan transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display uppercase text-bunker-text-primary tracking-wider mb-4">
            Institucional
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Sobre a Bunker 81
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Política de Privacidade
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Termos de Uso
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Trocas e Devoluções
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display uppercase text-bunker-text-primary tracking-wider mb-4">
            Atendimento
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Central de Ajuda
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Contato
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-bunker-tan">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-bunker-tan">
                Rastreamento
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display uppercase text-bunker-text-primary tracking-wider mb-4">
            Catálogo
          </h3>
          <p className="text-sm leading-relaxed">
            Consulte cada produto para escolher a variante e verificar preço e disponibilidade.
          </p>
        </div>
      </div>

      <div className="border-t border-bunker-graphite">
        <div className="max-w-[1400px] mx-auto px-4 py-5 text-center text-xs">
          <p>© 2026 Bunker 81 Airsoft. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
