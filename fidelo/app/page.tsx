import Link from "next/link";
import { clsx } from "clsx";
import { Check, Smartphone, Stamp, TrendingUp, Users } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { Reveal } from "@/components/Reveal";
import { PLANS } from "@/lib/plan";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* HERO — sombre bleu-nuit, centré (signature ASM) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-night to-night-deep text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-18%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-600/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[700px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
        </div>
        <div className="container-page relative pb-16 pt-24 text-center sm:pt-28">
          <div className="mx-auto max-w-3xl animate-fade-up">
            <span className="eyebrow text-brand-400">Un service signé ASM.</span>
            <h1 className="mt-5 font-display text-[2.7rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              La fidélité de vos clients,
              <br />
              <span className="text-brand-400">gérée par ASM.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Fidélo remplace la carte en carton par une carte digitale. ASM
              l'installe, la configure et vous accompagne — vous ajoutez un
              tampon d'un bouton. Vos clients reviennent.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/signup" size="lg" arrow>
                Démarrer avec ASM
              </Button>
              <Button href="/login" variant="secondary" size="lg">
                Voir la démo
              </Button>
            </div>
            <p className="mt-5 text-sm text-white/40">
              Essai gratuit jusqu'à 30 clients · Installé par ASM · Prêt en 48h
            </p>
          </div>

          {/* Carte en aperçu, sous le titre (à la manière du mockup ASM) */}
          <div className="relative mx-auto mt-14 w-full max-w-sm animate-fade-up [animation-delay:140ms]">
            <StampCard
              shopName="Café des Halles"
              rewardLabel="Une boisson offerte"
              stamps={7}
              goal={10}
              clientName="Julien P."
              qrValue="https://fidelo.app/scan/demo"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-[1.4rem] border border-white/10 bg-white/10 p-1.5 shadow-float backdrop-blur-md sm:block">
              <div className="flex items-center gap-3 rounded-[1.05rem] bg-white p-3.5 shadow-inset">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-extrabold leading-none text-brand-600">
                    +38%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">de clients qui reviennent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-7 text-sm text-slate-500">
          <span className="font-medium">Des commerces accompagnés par ASM :</span>
          {["Le Petit Bistrot", "Coiffure Éclat", "Snack O'Coin", "Boutique Lila", "Chez Marco"].map(
            (n) => (
              <span key={n} className="font-semibold text-slate-400">
                {n}
              </span>
            )
          )}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="fonctionnement" className="container-page py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Comment ça marche</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-ink sm:text-5xl">
            ASM s'occupe de tout
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Pas besoin d'être à l'aise avec la technologie. On installe, vous
            profitez.
          </p>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Stamp,
              step: "1",
              title: "ASM crée votre carte",
              text: "On configure votre récompense (ex : la 10ᵉ boisson offerte) à vos couleurs.",
            },
            {
              icon: Users,
              step: "2",
              title: "Vous ajoutez vos clients",
              text: "Un prénom, un numéro. Chaque client a sa carte digitale automatiquement.",
            },
            {
              icon: Smartphone,
              step: "3",
              title: "Un tampon par visite",
              text: "À chaque passage, appuyez sur « + ». Le client est notifié de sa récompense.",
            },
          ].map((s, i) => (
            <Reveal
              key={s.step}
              delay={i * 90}
              className="group rounded-[1.7rem] border border-slate-200/60 bg-white/50 p-1.5 shadow-soft transition-all duration-500 ease-spring hover:-translate-y-1 hover:shadow-float"
            >
              <div className="h-full rounded-[1.35rem] bg-white p-6 shadow-inset">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-white shadow-glow transition-transform duration-500 ease-spring group-hover:scale-105">
                    <s.icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <span className="font-display text-5xl font-extrabold text-slate-100">
                    {s.step}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* AVANTAGES — section sombre signature ASM */}
      <section id="avantages" className="bg-white py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Résultats</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl">
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
          {[
            { stat: "+38 %", label: "de clients qui reviennent, en moyenne", blue: true },
            { stat: "×3", label: "dépensé par un client fidèle vs un nouveau", blue: false },
            { stat: "48 h", label: "pour être installé et formé par ASM", blue: true },
          ].map((c, i) => (
            <Reveal key={c.label} delay={i * 90} className="px-4 text-center">
              <p
                className={clsx(
                  "font-display text-6xl font-extrabold leading-none tracking-tight sm:text-7xl",
                  c.blue ? "text-brand-500" : "text-ink"
                )}
              >
                {c.stat}
              </p>
              <p className="mx-auto mt-4 max-w-[16rem] text-slate-500">{c.label}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <Button href="/signup" size="lg" arrow>
            Commencer maintenant
          </Button>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="container-page py-24 lg:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Tarifs</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-ink sm:text-5xl">
            Un abonnement simple, sans surprise
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Testez gratuitement. Passez à Fidélo Pro, installé et géré par ASM,
            quand vous êtes prêt.
          </p>
        </Reveal>
        <div className="mx-auto mt-16 grid max-w-4xl items-start gap-6 md:grid-cols-2">
          {Object.values(PLANS).map((plan, i) => (
            <Reveal
              key={plan.id}
              delay={i * 90}
              className={clsx(
                "rounded-[1.9rem] p-1.5 shadow-soft transition-all duration-500 ease-spring hover:-translate-y-1 hover:shadow-float",
                plan.highlight
                  ? "bg-gradient-to-b from-brand-200/60 to-slate-200/40"
                  : "border border-slate-200/70 bg-white/50"
              )}
            >
              <div className="relative h-full rounded-[1.5rem] bg-white p-8 shadow-inset">
                {plan.highlight && (
                  <span className="absolute -top-3 right-8 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
                    Le plus populaire
                  </span>
                )}
                <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold text-ink">
                    {plan.price}€
                  </span>
                  <span className="text-slate-500">/mois</span>
                </div>
                <Button
                  href="/signup"
                  variant={plan.highlight ? "primary" : "secondary"}
                  full
                  arrow
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
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container-page pb-28">
        <Reveal className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-16 text-center text-white shadow-glow sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand-300/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-800/40 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
              Votre fidélité, installée par ASM<span className="text-brand-200">.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/85">
              Rejoignez les commerces qui font revenir leurs clients avec Fidélo.
              On s'occupe de la mise en place, vous gardez le sourire.
            </p>
            <div className="mt-9 flex justify-center">
              <Button href="/signup" variant="dark" size="lg" arrow>
                Démarrer avec ASM
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 bg-slate-50/60">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-10 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Fidélo by ASM<span className="asm-dot">.</span>{" "}
            Fait pour les commerces de quartier.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-ink">
              Connexion
            </Link>
            <Link href="/signup" className="hover:text-ink">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
