"use client";

import { clsx } from "clsx";
import { QrCode } from "./QrCode";

// Carte de fidélité au format « carte bancaire » premium — DA fidélo. by ASM.
// Dégradé bleu, nom du porteur, gros compteur, et QR intégré (optionnel).
export function StampCard({
  shopName,
  rewardLabel,
  stamps,
  goal,
  clientName,
  qrValue,
  compact = false,
}: {
  shopName: string;
  rewardLabel: string;
  stamps: number;
  goal: number;
  clientName?: string;
  qrValue?: string;
  compact?: boolean;
}) {
  const complete = stamps >= goal;
  const pct = Math.min(100, Math.round((stamps / goal) * 100));
  const code = cardCode(clientName || shopName);

  return (
    <div
      className={clsx(
        "relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.5rem] text-white shadow-card",
        "bg-gradient-to-br from-brand-400 via-brand-500 to-brand-800",
        compact ? "p-4" : "p-5 sm:p-6"
      )}
    >
      {/* reflets */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-900/40 blur-3xl" />

      <div className="relative flex h-full flex-col">
        {/* Haut : marque + QR / sans-contact */}
        <div className="flex items-start justify-between">
          <span
            className={clsx(
              "font-display font-extrabold lowercase leading-none",
              compact ? "text-base" : "text-lg"
            )}
          >
            fidélo<span className="text-white/70">.</span>
          </span>

          {qrValue ? (
            <span
              className={clsx(
                "grid shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-sm",
                compact ? "h-14 w-14" : "h-[76px] w-[76px]"
              )}
            >
              <QrCode value={qrValue} size={compact ? 44 : 64} className="rounded-md" />
            </span>
          ) : (
            <Contactless className={compact ? "h-5 w-5" : "h-6 w-6"} />
          )}
        </div>

        {/* Milieu : compteur + récompense + progression */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span
              className={clsx(
                "font-display font-extrabold tracking-tight",
                compact ? "text-2xl" : "text-3xl sm:text-[2rem]"
              )}
            >
              {stamps} / {goal}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-white/60">
              tampons
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
            {complete ? (
              <span className="font-semibold text-white">Récompense prête 🎉</span>
            ) : (
              <>Récompense : {rewardLabel}</>
            )}
          </p>
          {/* jauge de progression */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${complete ? 100 : pct}%` }}
            />
          </div>
        </div>

        {/* Bas : titulaire + code */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <span
            className={clsx(
              "truncate font-semibold uppercase tracking-wide",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {clientName || shopName}
          </span>
          <span className="shrink-0 font-mono text-[11px] tracking-widest text-white/55">
            {code}
          </span>
        </div>
      </div>
    </div>
  );
}

// Petit code « numéro de carte » déterministe pour le look premium.
function cardCode(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  const s = h.toString(36).toUpperCase().padStart(6, "0").slice(0, 6);
  return `FID ${s}`;
}

function Contactless({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8 8a6 6 0 0 1 0 8M11.5 5.5a10 10 0 0 1 0 13M4.5 10.5a3 3 0 0 1 0 3"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
