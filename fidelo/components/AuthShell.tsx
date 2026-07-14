import { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { StampCard } from "@/components/StampCard";

// Mise en page en deux colonnes pour connexion / inscription.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Colonne formulaire */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
          </div>
        </div>
      </div>

      {/* Colonne visuelle — bleu-nuit ASM */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-night to-night-deep lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white">
            La fidélité de vos clients,
            <br />
            <span className="text-brand-400">enfin simple à gérer.</span>
          </h2>
          <p className="mt-4 text-white/60">
            Un tampon par visite, une récompense à la clé. Vos clients reviennent,
            vous gardez le sourire.
          </p>
          <div className="mt-10 max-w-xs">
            <StampCard
              shopName="Café des Halles"
              rewardLabel="Une boisson offerte"
              stamps={8}
              goal={10}
              clientName="Amélie R."
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
