"use client";

import { clsx } from "clsx";
import { Check, Gift } from "lucide-react";
import { QrCode } from "./QrCode";

// Carte de fidélité — pass à deux zones (DA fidélo. by ASM).
// Haut bleu : marque + QR.  Bas bleu-nuit : grille de tampons + récompense.
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
    <div className="w-full overflow-hidden rounded-[1.5rem] shadow-card">
      {/* ---------- Zone haute : bleu ASM ---------- */}
      <div
        className={clsx(
          "relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 text-white",
          compact ? "p-4" : "p-5"
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center rounded-lg bg-white px-2 py-1.5 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/fidelo-logo.png"
                alt="fidélo. by ASM."
                style={{ height: compact ? 15 : 18, width: "auto" }}
                draggable={false}
              />
            </span>
            <span className="truncate text-sm font-bold uppercase tracking-wide text-white/90">
              {shopName}
            </span>
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Programme de fidélité
          </p>

          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={clsx(
                    "font-display font-extrabold tracking-tight",
                    compact ? "text-3xl" : "text-4xl"
                  )}
                >
                  {stamps}
                </span>
                <span className="text-sm text-white/60">/ {goal} {unit}</span>
              </div>
              <p className="mt-1 text-sm text-white/75">
                {complete ? (
                  <span className="font-semibold text-white">Récompense prête 🎉</span>
                ) : (
                  <>Récompense : {rewardLabel}</>
                )}
              </p>
            </div>

            {qrValue && (
              <span
                className={clsx(
                  "grid shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-sm",
                  compact ? "h-[72px] w-[72px]" : "h-[92px] w-[92px]"
                )}
              >
                <QrCode value={qrValue} size={compact ? 60 : 80} className="rounded-md" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Zone basse : grille de tampons ---------- */}
      <div
        className={clsx(
          "bg-gradient-to-b from-night to-night-deep text-white",
          compact ? "p-4" : "p-5"
        )}
      >
        <div
          className="grid gap-2"
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
                    ? "border-brand-400 bg-brand-500 text-white shadow-[0_4px_14px_-4px_rgba(47,107,255,.7)]"
                    : "border-white/15 bg-white/[0.06] text-white/25"
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
                ? "bg-white text-brand-700 shadow-glow"
                : "border border-dashed border-white/25 bg-white/[0.04] text-white/50"
            )}
          >
            <Gift className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/10 pt-3.5">
          <span
            className={clsx(
              "truncate font-semibold uppercase tracking-wide",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {clientName || shopName}
          </span>
          <span className="shrink-0 font-mono text-[11px] tracking-widest text-white/45">
            {code}
          </span>
        </div>
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
