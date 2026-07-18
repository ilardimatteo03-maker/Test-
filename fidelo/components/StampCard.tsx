"use client";

import { clsx } from "clsx";
import { Check, Gift } from "lucide-react";
import { QrCode } from "./QrCode";

// Carte de fidélité — surface blanche unique (DA fidélo. by ASM).
// Marque + QR en tête, grille de tampons, titulaire en pied.
export function StampCard({
  shopName,
  rewardLabel,
  stamps,
  goal,
  clientName,
  qrValue,
  unit = "tampons",
  compact = false,
}: {
  shopName: string;
  rewardLabel: string;
  stamps: number;
  goal: number;
  clientName?: string;
  qrValue?: string;
  unit?: string;
  compact?: boolean;
}) {
  const complete = stamps >= goal;
  const cols = goal <= 5 ? 5 : goal <= 8 ? 4 : goal <= 10 ? 5 : 6;
  const code = cardCode(clientName || shopName);
  const dot = compact ? "h-6 w-6" : "h-7 w-7";

  return (
    <div
      className={clsx(
        "w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-ink shadow-card",
        compact ? "p-4" : "p-5"
      )}
    >
      {/* En-tête : logo + commerce */}
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/fidelo-logo.png"
          alt="fidélo. by ASM."
          style={{ height: compact ? 18 : 22, width: "auto" }}
          draggable={false}
        />
        <span className="ml-auto truncate text-sm font-bold uppercase tracking-wide text-slate-500">
          {shopName}
        </span>
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Programme de fidélité
      </p>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={clsx(
                "font-display font-extrabold tracking-tight text-ink",
                compact ? "text-3xl" : "text-4xl"
              )}
            >
              {stamps}
            </span>
            <span className="text-sm text-slate-500">
              / {goal} {unit}
            </span>
          </div>
          <p className="mt-1 text-sm">
            {complete ? (
              <span className="font-semibold text-brand-600">Récompense prête 🎉</span>
            ) : (
              <span className="text-slate-600">Récompense : {rewardLabel}</span>
            )}
          </p>
        </div>

        {qrValue && (
          <span
            className={clsx(
              "grid shrink-0 place-items-center rounded-xl border border-slate-200 bg-white p-1.5",
              compact ? "h-[72px] w-[72px]" : "h-[92px] w-[92px]"
            )}
          >
            <QrCode value={qrValue} size={compact ? 60 : 80} className="rounded-md" />
          </span>
        )}
      </div>

      {/* Grille de tampons */}
      <div
        className="mt-5 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < stamps;
          return (
            <span
              key={i}
              className={clsx(
                "grid aspect-square place-items-center rounded-full border transition-all",
                dot,
                filled
                  ? "border-brand-500 bg-brand-500 text-white shadow-[0_4px_12px_-4px_rgba(47,107,255,.5)]"
                  : "border-slate-200 bg-slate-100 text-slate-300"
              )}
            >
              {filled ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </span>
          );
        })}
        {/* Cellule récompense */}
        <span
          className={clsx(
            "grid aspect-square place-items-center rounded-full transition-all",
            dot,
            complete
              ? "bg-brand-500 text-white shadow-[0_4px_12px_-4px_rgba(47,107,255,.5)]"
              : "border border-dashed border-slate-300 bg-white text-slate-400"
          )}
        >
          <Gift className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* Pied : titulaire + code */}
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3.5">
        <span
          className={clsx(
            "truncate font-semibold uppercase tracking-wide text-ink",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {clientName || shopName}
        </span>
        <span className="shrink-0 font-mono text-[11px] tracking-widest text-slate-400">
          {code}
        </span>
      </div>
    </div>
  );
}

// Code « numéro de carte » déterministe (look premium).
function cardCode(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  const s = h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `FID ${s}`;
}
