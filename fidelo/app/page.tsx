import Link from "next/link";
import { clsx } from "clsx";
import {
  Check,
  QrCode,
  Smartphone,
  Sparkles,
  Stamp,
  TrendingUp,
  Users,
} from "lucide-react";
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

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-14%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-100/50 blur-3xl" />
          <div className="absolute right-[6%] top-[38%] h-72 w-72 rounded-full bg-brand-200/25 blur-3xl" />
        </div>
        <div className="container-page grid items-center gap-14 pb-20 pt-14 lg:grid-cols-2 lg:pb-28 lg:pt-24">
          <div className="animate-fade-up">
            <span className="eyebrow gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Un service signé ASM<span className="asm-dot">.</span>
            </span>
            <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.03] text-ink sm:text-6xl">
              La fidélité de vos clients,{" "}
              <span className="text-gradient">gérée par ASM</span>
              <span className="asm-dot">.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-600">
              Fidélo remplace la carte de fidélité en carton par une carte
              digitale. ASM l'installe, la configure et vous accompagne — vous
              ajoutez un tampon d'un bouton. Vos clients reviennent.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/signup" size="lg" arrow>
                Démarrer avec ASM
              </Button>
              <Button href="/login" variant="secondary" size="lg">
                Voir la démo
              </Button>
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Essai gratuit jusqu'à 30 clients · Installé par ASM · Prêt en 48h
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm animate-fade-up [animation-delay:120ms]">
            <StampCard
              shopName="Café des Halles"
              rewardLabel="Une boisson offerte"
              stamps={7}
              goal={10}
              clientName="Julien P."
            />
            {/* Badge flottant — double-bezel (soft-skill) */}
            <div className="absolute -bottom-6 -left-6 hidden rounded-[1.4rem] border border-slate-200/60 bg-white/60 p-1.5 shadow-float backdrop-blur-sm sm:block">
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
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-6 text-sm text-slate-500">
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
      <section
        id="avantages"
        className="relative overflow-hidden bg-gradient-to-b from-night to-night-deep py-24 text-white lg:py-32"
      >
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="container-page grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow border-white/15 bg-white/5 text-brand-300">
              Résultats
            </span>
            <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Vos clients reviennent.
              <br />
              <span className="text-brand-400">Votre caisse le ressent.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Un client fidèle dépense en moyenne 3 fois plus qu'un nouveau. Fidélo
              vous aide à les faire revenir sans effort.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Aucune carte à imprimer, rien à perdre pour le client",
                "Vous voyez d'un coup d'œil qui sont vos meilleurs clients",
                "Une page carte que vos clients gardent sur leur téléphone",
                "Fonctionne sur mobile, tablette, ordinateur — partout",
              ].map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-white/85">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <Button href="/signup" variant="primary" size="lg" arrow>
                Commencer maintenant
              </Button>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Users, stat: "24", label: "clients fidèles suivis" },
              { icon: Stamp, stat: "312", label: "tampons ce mois-ci" },
              { icon: TrendingUp, stat: "+38%", label: "de visites répétées" },
              { icon: QrCode, stat: "3 min", label: "pour tout configurer" },
            ].map((c, i) => (
              <Reveal
                key={c.label}
                delay={i * 80}
                className={clsx(
                  "rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm",
                  i % 2 === 1 && "sm:mt-8"
                )}
              >
                <c.icon className="h-6 w-6 text-brand-400" strokeWidth={1.75} />
                <p className="mt-4 font-display text-[2.75rem] font-extrabold leading-none text-brand-400">
                  {c.stat}
                </p>
                <p className="mt-2 text-sm text-white/60">{c.label}</p>
              </Reveal>
            ))}
          </div>
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
