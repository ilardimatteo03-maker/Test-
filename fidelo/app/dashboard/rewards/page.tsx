"use client";

import { FormEvent, useState } from "react";
import { Check, CircleDot, Gift, Stamp } from "lucide-react";
import { clsx } from "clsx";
import { Button, Card, Input, PageHeading } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { StampCard } from "@/components/StampCard";
import { useToast } from "@/components/Toast";
import { currentMerchant, updateMerchant } from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";
import { unitWord } from "@/lib/format";
import type { ProgramType } from "@/lib/types";

const GOAL_OPTIONS = [5, 6, 8, 10, 12];

export default function RewardsPage() {
  useStoreVersion();
  const toast = useToast();
  const merchant = currentMerchant();
  const [goal, setGoal] = useState(merchant?.stampsGoal ?? 10);
  const [programType, setProgramType] = useState<ProgramType>(
    merchant?.programType ?? "stamps"
  );

  if (!merchant) return null;

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateMerchant({
      shopName: String(form.get("shopName") || merchant!.shopName),
      rewardLabel: String(form.get("rewardLabel") || merchant!.rewardLabel),
      stampsGoal: goal,
      programType,
    });
    toast("Carte mise à jour ✓");
  }

  return (
    <div>
      <PageHeading
        title="Carte & récompense"
        subtitle="Configurez votre programme de fidélité. Vos clients verront ces informations."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Formulaire */}
        <Reveal className="lg:col-span-3">
        <Card bezel className="p-6">
          <form onSubmit={onSave} className="space-y-5">
            <Input
              name="shopName"
              label="Nom du commerce"
              defaultValue={merchant.shopName}
              required
            />
            <Input
              name="rewardLabel"
              label="Récompense offerte"
              defaultValue={merchant.rewardLabel}
              hint="Ce que le client gagne une fois la carte remplie."
              required
            />
            {/* Type de programme : tampons (visites) ou points */}
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Type de programme
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "stamps", label: "Tampons", desc: "1 visite = 1 tampon", icon: Stamp },
                    { id: "points", label: "Points", desc: "1 passage = 1 point", icon: CircleDot },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProgramType(p.id)}
                    className={clsx(
                      "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-300 ease-spring",
                      programType === p.id
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-300"
                        : "border-slate-200 bg-white hover:border-brand-300"
                    )}
                  >
                    <p.icon
                      className={clsx(
                        "mt-0.5 h-5 w-5 shrink-0",
                        programType === p.id ? "text-brand-600" : "text-slate-400"
                      )}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{p.label}</span>
                      <span className="block text-xs text-slate-500">{p.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre de {unitWord(programType, 2)} pour une récompense
              </span>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGoal(n)}
                    className={`grid h-12 w-12 place-items-center rounded-xl border text-sm font-semibold transition-all duration-300 ease-spring ${
                      goal === n
                        ? "border-brand-500 bg-brand-500 text-white shadow-glow"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" size="lg">
              <Check className="h-5 w-5" />
              Enregistrer
            </Button>
          </form>
        </Card>
        </Reveal>

        {/* Aperçu en direct */}
        <Reveal delay={100} className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Gift className="h-4 w-4" />
            Aperçu de la carte
          </div>
          <StampCard
            shopName={merchant.shopName}
            rewardLabel={merchant.rewardLabel}
            stamps={Math.min(3, goal)}
            goal={goal}
            clientName="Votre client"
            unit={unitWord(programType, 2)}
          />
          <p className="mt-3 text-center text-xs text-slate-400">
            C'est exactement ce que verront vos clients.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
