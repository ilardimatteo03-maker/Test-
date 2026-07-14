import Link from "next/link";
import {
  ArrowRight,
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
import { Button, Card } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { PLANS } from "@/lib/plan";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />
        </div>
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-sm font-medium text-brand-700">
              <Sparkles className="h-4 w-4" />
              Un service signé ASM
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              La fidélité de vos clients,{" "}
              <span className="text-gradient">gérée par ASM</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              Fidélo remplace la carte de fidélité en carton par une carte
              digitale. ASM l'installe, la configure et vous accompagne. Vous,
              vous ajoutez un tampon d'un simple bouton. Vos clients reviennent.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/signup" size="lg">
                Démarrer avec ASM
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button href="/login" variant="secondary" size="lg">
                Voir la démo
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
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
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-card sm:block">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold leading-none text-brand-600">
                    +38%
                  </p>
                  <p className="text-xs text-slate-500">de clients qui reviennent</p>
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
      <section id="fonctionnement" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Comment ça marche</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            ASM s'occupe de tout
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Pas besoin d'être à l'aise avec la technologie. On installe, vous
            profitez.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
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
          ].map((s) => (
            <Card key={s.step} className="p-7">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
                  <s.icon className="h-6 w-6" />
                </span>
                <span className="text-5xl font-bold text-slate-100">{s.step}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-ink">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* AVANTAGES — section sombre signature ASM */}
      <section
        id="avantages"
        className="bg-gradient-to-b from-night to-night-deep py-20 text-white"
      >
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Résultats</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              Vos clients reviennent.
              <br />
              <span className="text-brand-400">Votre caisse le ressent.</span>
            </h2>
            <p className="mt-4 text-lg text-white/70">
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
            <div className="mt-8">
              <Button href="/signup" variant="primary" size="lg">
                Commencer maintenant
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Users, stat: "24", label: "clients fidèles suivis" },
              { icon: Stamp, stat: "312", label: "tampons ce mois-ci" },
              { icon: TrendingUp, stat: "+38%", label: "de visites répétées" },
              { icon: QrCode, stat: "3 min", label: "pour tout configurer" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <c.icon className="h-6 w-6 text-brand-400" />
                <p className="mt-4 font-display text-4xl font-extrabold text-brand-400">
                  {c.stat}
                </p>
                <p className="mt-1 text-sm text-white/60">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="container-page py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Tarifs</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            Un abonnement simple, sans surprise
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            Testez gratuitement. Passez à Fidélo Pro, installé et géré par ASM,
            quand vous êtes prêt.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {Object.values(PLANS).map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? "relative border-brand-200 p-8 ring-2 ring-brand-500"
                  : "p-8"
              }
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  Le plus populaire
                </span>
              )}
              <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-ink">
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
              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-14 text-center text-white shadow-glow sm:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-400/40 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Votre fidélité, installée par ASM
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Rejoignez les commerces qui font revenir leurs clients avec Fidélo.
              On s'occupe de la mise en place, vous gardez le sourire.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="/signup" variant="dark" size="lg">
                Démarrer avec ASM
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
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
