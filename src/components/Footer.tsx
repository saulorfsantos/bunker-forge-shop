import { Link } from "@tanstack/react-router";
import logoShield from "@/assets/logo-shield.png";

export function Footer() {
  return (
    <footer className="bg-bunker-black border-t border-bunker-graphite text-bunker-text-secondary">
      <div className="max-w-[1400px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-4">
            <img src={logoShield} alt="Bunker 81" className="h-16 w-auto" />
          </Link>
          <p className="text-sm leading-relaxed">
            Bunker 81 Airsoft — consulte o catálogo para verificar produtos, variantes, preços e
            disponibilidade.
          </p>
        </div>

        <div>
          <h3 className="font-display uppercase text-bunker-text-primary tracking-wider mb-4">
            Atendimento
          </h3>
          <p className="text-sm leading-relaxed">
            Após o registro do pedido, a Bunker 81 entra em contato para orientar pagamento e
            recebimento.
          </p>
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
