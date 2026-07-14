"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/Logo";
import { Button, Card, Input } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import {
  addClient,
  currentMerchant,
  updateMerchant,
} from "@/lib/store";
import type { ShopCategory } from "@/lib/types";

const CATEGORIES: { id: ShopCategory; label: string; emoji: string }[] = [
  { id: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { id: "cafe", label: "Café / Bar", emoji: "☕" },
  { id: "coiffeur", label: "Coiffeur", emoji: "💇" },
  { id: "snack", label: "Snack", emoji: "🥪" },
  { id: "boutique", label: "Boutique", emoji: "🛍️" },
  { id: "autre", label: "Autre", emoji: "✨" },
];

const REWARD_SUGGESTIONS = [
  "Une boisson offerte",
  "-10% sur l'addition",
  "Une coupe offerte",
  "Un dessert offert",
  "Un produit gratuit",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  const [category, setCategory] = useState<ShopCategory>("cafe");
  const [reward, setReward] = useState("Une boisson offerte");
  const [goal, setGoal] = useState(10);
  const [firstClient, setFirstClient] = useState("");

  useEffect(() => {
    const m = currentMerchant();
    if (!m) {
      router.replace("/signup");
      return;
    }
    setCategory(m.category);
    setReady(true);
  }, [router]);

  if (!ready) return null;

  const steps = ["Votre commerce", "Votre récompense", "C'est parti"];

  function next() {
    if (step < 2) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function finish() {
    updateMerchant({ category, rewardLabel: reward, stampsGoal: goal, onboarded: true });
    const merchant = currentMerchant();
    if (firstClient.trim() && merchant) {
      addClient(merchant.id, firstClient.trim(), "");
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-lg flex-col px-5 py-8">
        <div className="flex items-center justify-center">
          <Logo href={null} />
        </div>

        {/* Progression */}
        <div className="mx-auto mt-8 flex w-full max-w-xs items-center">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div
                className={clsx(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors",
                  i < step
                    ? "bg-brand-600 text-white"
                    : i === step
                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : "bg-slate-200 text-slate-400"
                )}
              >
                {i < step ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    "h-1 flex-1 rounded",
                    i < step ? "bg-brand-600" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-medium text-slate-500">
          Étape {step + 1} sur 3 · {steps[step]}
        </p>

        <Card bezel outerClassName="mt-6" className="p-6 sm:p-8">
          {/* Étape 1 : type de commerce */}
          {step === 0 && (
            <div className="animate-fade-up">
              <h1 className="text-xl font-bold text-ink">Quel est votre commerce ?</h1>
              <p className="mt-1 text-slate-500">On adapte tout pour vous.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={clsx(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                      category === c.id
                        ? "border-brand-600 bg-brand-50 ring-1 ring-brand-200"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-sm font-medium text-ink">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2 : récompense */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="text-xl font-bold text-ink">Quelle récompense offrez-vous ?</h1>
              <p className="mt-1 text-slate-500">
                Après {goal} tampons, le client gagne cette récompense.
              </p>
              <div className="mt-5 space-y-4">
                <Input
                  label="Récompense"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="Ex : Une boisson offerte"
                />
                <div className="flex flex-wrap gap-2">
                  {REWARD_SUGGESTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReward(r)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nombre de tampons
                  </span>
                  <div className="flex gap-2">
                    {[5, 8, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setGoal(n)}
                        className={clsx(
                          "grid h-11 w-11 place-items-center rounded-xl border text-sm font-semibold transition-all",
                          goal === n
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 : premier client + aperçu */}
          {step === 2 && (
            <div className="animate-fade-up">
              <div className="mb-4 flex items-center gap-2 text-brand-700">
                <PartyPopper className="h-5 w-5" />
                <h1 className="text-xl font-bold text-ink">Tout est prêt !</h1>
              </div>
              <p className="text-slate-500">
                Voici votre carte. Ajoutez un premier client pour l'essayer (optionnel).
              </p>
              <div className="mt-5">
                <StampCard
                  shopName={currentMerchant()?.shopName || "Mon commerce"}
                  rewardLabel={reward}
                  stamps={2}
                  goal={goal}
                  compact
                />
              </div>
              <div className="mt-5">
                <Input
                  label="Premier client (optionnel)"
                  value={firstClient}
                  onChange={(e) => setFirstClient(e.target.value)}
                  placeholder="Ex : Julien Petit"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-7 flex gap-3">
            {step > 0 && (
              <Button variant="secondary" onClick={back}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            )}
            {step < 2 ? (
              <Button full onClick={next}>
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button full size="lg" onClick={finish}>
                Accéder à mon tableau de bord
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
