"use client";

import { FormEvent } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { Badge, Button, Card, Input, PageHeading } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { useToast } from "@/components/Toast";
import { currentMerchant, resetDemo, setPlan, updateMerchant } from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { PLANS } from "@/lib/plan";
import type { PlanId } from "@/lib/types";

export default function SettingsPage() {
  useStoreVersion();
  const toast = useToast();
  const merchant = currentMerchant();
  if (!merchant) return null;

  function onSaveAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateMerchant({
      ownerName: String(form.get("ownerName") || ""),
      email: String(form.get("email") || ""),
    });
    toast("Compte mis à jour ✓");
  }

  function changePlan(plan: PlanId) {
    setPlan(plan);
    toast(
      plan === "pro"
        ? "🎉 Bienvenue dans le plan Pro !"
        : "Vous êtes repassé au plan Gratuit."
    );
  }

  return (
    <div>
      <PageHeading title="Compte" subtitle="Gérez vos informations et votre abonnement." />

      {/* Informations */}
      <Reveal>
      <Card bezel className="p-6">
        <h2 className="font-bold text-ink">Informations</h2>
        <form onSubmit={onSaveAccount} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input name="ownerName" label="Votre nom" defaultValue={merchant.ownerName} />
          <Input name="email" type="email" label="Email" defaultValue={merchant.email} />
          <div className="sm:col-span-2">
            <Button type="submit">
              <Check className="h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
      </Reveal>

      {/* Abonnement */}
      <Reveal className="mt-6" delay={80}>
      <Card bezel className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">Abonnement</h2>
          <Badge color={merchant.plan === "pro" ? "brand" : "slate"}>
            Plan actuel : {PLANS[merchant.plan].name}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Object.values(PLANS).map((plan) => {
            const current = plan.id === merchant.plan;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 transition-all duration-500 ease-spring ${
                  plan.highlight
                    ? "border-brand-200 bg-brand-50/40 ring-1 ring-brand-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-ink">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                      <Sparkles className="h-3.5 w-3.5" /> Recommandé
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-3xl font-extrabold text-ink">
                  {plan.price}€
                  <span className="text-sm font-normal text-slate-400">/mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {current ? (
                    <Button variant="secondary" full disabled>
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      variant={plan.highlight ? "primary" : "secondary"}
                      full
                      onClick={() => changePlan(plan.id)}
                    >
                      {plan.id === "pro" ? "Passer au Pro" : "Revenir au Gratuit"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Démo : le changement de plan est instantané et sans paiement réel. En
          production, cette action ouvre le paiement sécurisé Stripe.
        </p>
      </Card>
      </Reveal>

      {/* Zone démo */}
      <Reveal className="mt-6" delay={160}>
      <Card bezel className="p-6">
        <h2 className="font-bold text-ink">Données de démonstration</h2>
        <p className="mt-1 text-sm text-slate-500">
          Réinitialisez les clients et l'activité pour repartir de la démo d'origine.
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => {
            resetDemo();
            toast("Démo réinitialisée");
            setTimeout(() => location.reload(), 400);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser la démo
        </Button>
      </Card>
      </Reveal>
    </div>
  );
}
