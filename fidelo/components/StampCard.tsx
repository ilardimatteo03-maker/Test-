"use client";

import { clsx } from "clsx";
import { Check, Gift, Star } from "lucide-react";

// Représentation visuelle de la carte de fidélité — réutilisée dans le
// dashboard et sur la page publique du client.
export function StampCard({
  shopName,
  rewardLabel,
  stamps,
  goal,
  clientName,
  compact = false,
}: {
  shopName: string;
  rewardLabel: string;
  stamps: number;
  goal: number;
  clientName?: string;
  compact?: boolean;
}) {
  const cells = Array.from({ length: goal });
  const complete = stamps >= goal;
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-night to-night-deep text-white shadow-card",
        compact ? "p-5" : "p-6 sm:p-8"
      )}
    >
      {/* halo bleu ASM */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-brand-400/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Carte de fidélité
            </p>
            <p className="mt-1 text-lg font-bold">{shopName}</p>
          </div>
          <Star className="h-6 w-6 text-brand-300" fill="currentColor" />
        </div>

        {clientName && (
          <p className="mt-4 text-sm text-white/70">{clientName}</p>
        )}

        <div
          className={clsx(
            "mt-5 grid gap-2.5",
            goal <= 6 ? "grid-cols-3" : goal <= 10 ? "grid-cols-5" : "grid-cols-6"
          )}
        >
          {cells.map((_, i) => {
            const filled = i < stamps;
            return (
              <div
                key={i}
                className={clsx(
                  "grid aspect-square place-items-center rounded-full border transition-all",
                  filled
                    ? "border-brand-400 bg-brand-500 shadow-glow animate-pop"
                    : "border-white/15 bg-white/5"
                )}
              >
                {filled ? (
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Gift className="h-4 w-4 text-brand-300" />
            {rewardLabel}
          </div>
          <span
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-bold",
              complete ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white"
            )}
          >
            {complete ? "Récompense prête 🎉" : `${stamps} / ${goal}`}
          </span>
        </div>
      </div>
    </div>
  );
}
