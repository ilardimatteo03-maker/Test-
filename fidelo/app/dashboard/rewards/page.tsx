"use client";

import { FormEvent, useState } from "react";
import { Check, Gift } from "lucide-react";
import { Button, Card, Input, PageHeading } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { useToast } from "@/components/Toast";
import { currentMerchant, updateMerchant } from "@/lib/store";
import { useStoreVersion } from "@/lib/useStore";

const GOAL_OPTIONS = [5, 6, 8, 10, 12];

export default function RewardsPage() {
  useStoreVersion();
  const toast = useToast();
  const merchant = currentMerchant();
  const [goal, setGoal] = useState(merchant?.stampsGoal ?? 10);

  if (!merchant) return null;

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateMerchant({
      shopName: String(form.get("shopName") || merchant!.shopName),
      rewardLabel: String(form.get("rewardLabel") || merchant!.rewardLabel),
      stampsGoal: goal,
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
        <Card className="p-6 lg:col-span-3">
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
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre de tampons pour une récompense
              </span>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGoal(n)}
                    className={`grid h-12 w-12 place-items-center rounded-xl border text-sm font-semibold transition-all ${
                      goal === n
                        ? "border-brand-600 bg-brand-600 text-white shadow-glow"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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

        {/* Aperçu en direct */}
        <div className="lg:col-span-2">
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
          />
          <p className="mt-3 text-center text-xs text-slate-400">
            C'est exactement ce que verront vos clients.
          </p>
        </div>
      </div>
    </div>
  );
}
