import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-gradient-to-b from-slate-50 to-slate-100 px-5">
      <div className="text-center">
        <div className="flex justify-center">
          <Logo href={null} />
        </div>
        <p className="mt-10 font-display text-7xl font-extrabold text-ink">
          404<span className="text-brand-500">.</span>
        </p>
        <h1 className="mt-4 text-xl font-bold text-ink">
          Cette page n'existe pas
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-slate-500">
          Le lien est peut-être erroné, ou la page a été déplacée.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/" size="lg" arrow>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
