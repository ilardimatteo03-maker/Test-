import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight, Check, ScanLine, Stamp, Wallet } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { Reveal } from "@/components/Reveal";
import { PLANS } from "@/lib/plan";

const SERVICES = [
  {
    icon: Stamp,
    title: "Programme de fidélité",
    text: "Tampons ou points, une récompense automatique. Configuré à vos couleurs par ASM.",
  },
  {
    icon: ScanLine,
    title: "Scan en caisse",
    text: "Un client passe, vous scannez son QR. Le tampon s'ajoute tout seul, sans friction.",
  },
  {
    icon: Wallet,
    title: "Wallet & notifications",
    text: "La carte s'ajoute à Apple / Google Wallet. Le client est prévenu par email dès qu'il gagne.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "ASM installe votre carte",
    text: "Récompense, objectif, visuels : tout est configuré pour vous en 48h.",
  },
  {
    n: "02",
    title: "Vous ajoutez vos clients",
    text: "Un prénom, un numéro. Chaque client a sa carte digitale automatiquement.",
  },
  {
    n: "03",
    title: "Vos clients reviennent",
    text: "Un tampon par visite, une récompense à la clé. La fidélité, sans effort.",
  },
];

const RESULTS = [
  { stat: "+38 %", label: "de clients qui reviennent, en moyenne", blue: true },
  { stat: "×3", label: "dépensé par un client fidèle vs un nouveau", blue: false },
  { stat: "48 h", label: "pour être installé et formé par ASM", blue: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* ---------- HERO : navy solide, centré, un seul CTA + mockup ---------- */}
      <section className="relative overflow-hidden bg-night text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-30%] h-[560px] w-[1000px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        </div>
        <div className="container-page relative pb-16 pt-20 text-center sm:pt-24">
          <span className="eyebrow text-brand-400">Un service signé ASM.</span>
          <h1 className="mx-auto mt-5 max-w-4xl font-display text-[2.85rem] font-extrabold leading-[0.98] tracking-[-0.03em] sm:text-7xl">
            La fidélité de vos clients,
            <br />
            <span className="text-brand-400">gérée par ASM.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
            Fidélo remplace la carte en carton par une carte digitale. ASM
            l'installe, la configure et vous accompagne. Chaque visite compte,
            chaque client revient.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3.5">
            <Button href="/signup" size="lg">
              Démarrer avec ASM
            </Button>
            <Link
              href="/login"
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              ou voir la démo →
            </Link>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl animate-fade-up [animation-delay:120ms]">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ---------- SOCIAL PROOF ---------- */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-7 text-sm text-slate-400">
          <span className="font-medium text-slate-500">
            Des commerces accompagnés par ASM :
          </span>
          {["Le Petit Bistrot", "Coiffure Éclat", "Snack O'Coin", "Boutique Lila", "Chez Marco"].map(
            (n) => (
              <span key={n} className="font-semibold">
                {n}
              </span>
            )
          )}
        </div>
      </section>

      {/* ---------- FONCTIONNALITÉS (cartes plates ASM) ---------- */}
      <section id="fonctionnement" className="container-page py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Fonctionnalités</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.03em] text-ink sm:text-5xl">
            Tout ce qu'il faut pour fidéliser
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Un outil, pensé pour les commerces de quartier. Simple pour vous,
            évident pour vos clients.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal
              key={s.title}
              delay={i * 90}
              className="rounded-2xl bg-slate-50 p-7"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-brand-600 shadow-soft">
                <s.icon className="h-6 w-6" strokeWidth={1.9} />
              </span>
              <h3 className="mt-5 text-xl font-bold tracking-[-0.02em] text-ink">
                {s.title}
              </h3>
              <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                Découvrir <ArrowRight className="h-4 w-4" />
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- COMMENT ÇA MARCHE — éditorial + carte client ---------- */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="container-page grid items-center gap-14 py-24 lg:grid-cols-2 lg:py-32">
          <Reveal>
            <span className="eyebrow">Comment ça marche</span>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.03em] text-ink sm:text-5xl">
              ASM s'occupe de tout.
            </h2>
            <p className="mt-4 max-w-md text-lg text-slate-600">
              Pas besoin d'être à l'aise avec la technologie. On installe, vous
              profitez.
            </p>
            <div className="mt-10 space-y-8">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-5">
                  <span className="font-display text-lg font-extrabold text-brand-500">
                    {s.n}
                  </span>
                  <div className="border-l border-slate-200 pl-5">
                    <h3 className="text-lg font-bold tracking-[-0.02em] text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-slate-600">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120} className="mx-auto w-full max-w-sm">
            <StampCard
              shopName="Café des Halles"
              rewardLabel="Une boisson offerte"
              stamps={7}
              goal={10}
              clientName="Julien P."
              qrValue="https://fidelo.app/scan/demo"
            />
          </Reveal>
        </div>
      </section>

      {/* ---------- RÉSULTATS (gros chiffres bleu/noir, style ASM) ---------- */}
      <section id="resultats" className="container-page py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Résultats</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl">
            Ce qui fait revenir
            <br />
            vos clients.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-600">
            Un client fidèle dépense plus et revient plus souvent. Fidélo mesure
            tout, sans effort de votre part.
          </p>
        </Reveal>
        <div className="mx-auto mt-16 grid max-w-4xl gap-y-14 sm:grid-cols-3">
          {RESULTS.map((c, i) => (
            <Reveal key={c.label} delay={i * 90} className="px-4 text-center">
              <p
                className={clsx(
                  "font-display text-6xl font-extrabold leading-none tracking-[-0.04em] sm:text-7xl",
                  c.blue ? "text-brand-500" : "text-ink"
                )}
              >
                {c.stat}
              </p>
              <p className="mx-auto mt-4 max-w-[16rem] text-slate-500">{c.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- TARIFS (cartes plates) ---------- */}
      <section id="tarifs" className="border-y border-slate-100 bg-slate-50 py-24 lg:py-32">
        <Reveal className="container-page mx-auto max-w-2xl text-center">
          <span className="eyebrow">Tarifs</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.03em] text-ink sm:text-5xl">
            Un abonnement simple, sans surprise
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Testez gratuitement. Passez à Fidélo Pro, installé et géré par ASM,
            quand vous êtes prêt.
          </p>
        </Reveal>
        <div className="container-page mx-auto mt-16 grid max-w-4xl items-start gap-5 md:grid-cols-2">
          {Object.values(PLANS).map((plan, i) => (
            <Reveal
              key={plan.id}
              delay={i * 90}
              className={clsx(
                "rounded-2xl border bg-white p-8",
                plan.highlight ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                {plan.highlight && (
                  <span className="rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Populaire
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold tracking-[-0.03em] text-ink">
                  {plan.price}€
                </span>
                <span className="text-slate-500">/mois</span>
              </div>
              <Button
                href="/signup"
                variant={plan.highlight ? "primary" : "secondary"}
                full
                className="mt-6"
              >
                {plan.price === 0 ? "Tester gratuitement" : "Être installé par ASM"}
              </Button>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="bg-night text-white">
        <Reveal className="container-page py-24 text-center lg:py-28">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Votre fidélité, installée par ASM.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/60">
            Rejoignez les commerces qui font revenir leurs clients avec Fidélo.
            On s'occupe de la mise en place, vous gardez le sourire.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/signup" size="lg">
              Démarrer avec ASM
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ---------- FOOTER minimal ASM ---------- */}
      <footer className="bg-white">
        <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500">
              La carte de fidélité digitale des commerces de quartier, éditée et
              opérée par l'agence ASM.
            </p>
          </div>
          <FooterCol
            title="Produit"
            links={[
              ["Fonctionnalités", "#fonctionnement"],
              ["Résultats", "#resultats"],
              ["Tarifs", "#tarifs"],
            ]}
          />
          <FooterCol
            title="Compte"
            links={[
              ["Se connecter", "/login"],
              ["Créer un compte", "/signup"],
              ["Voir la démo", "/login"],
            ]}
          />
          <FooterCol
            title="Contact"
            links={[
              ["contact@asm-digital.com", "/"],
              ["+33 1 00 00 00 00", "/"],
            ]}
          />
        </div>
        <div className="border-t border-slate-100">
          <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-slate-400 sm:flex-row">
            <span>© {new Date().getFullYear()} Fidélo by ASM. Tous droits réservés.</span>
            <span>La fidélité, gérée par ASM.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-slate-600 hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
