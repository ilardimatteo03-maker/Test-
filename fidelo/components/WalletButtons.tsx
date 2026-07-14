"use client";

import { useState } from "react";
import { Apple, Wallet } from "lucide-react";

// Boutons « Ajouter au Wallet ». Masqués tant que la fonctionnalité n'est pas
// activée (NEXT_PUBLIC_WALLET_ENABLED="true" + identifiants Apple/Google).
export function WalletButtons({ clientId }: { clientId: string }) {
  const enabled = process.env.NEXT_PUBLIC_WALLET_ENABLED === "true";
  const [loading, setLoading] = useState(false);

  if (!enabled) return null;

  async function addToGoogle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/google/${clientId}`);
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-soft">
      <span className="eyebrow">
        <Wallet className="mr-1.5 h-3.5 w-3.5" />
        Toujours à portée de main
      </span>
      <p className="mt-3 text-sm font-medium text-ink">
        Ajoutez votre carte à votre téléphone
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        {/* Apple Wallet : lien direct vers le .pkpass (iOS l'ouvre). */}
        <a
          href={`/api/wallet/apple/${clientId}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-soft"
        >
          <Apple className="h-4 w-4" />
          Ajouter à Apple Wallet
        </a>
        {/* Google Wallet : génère le lien signé puis redirige. */}
        <button
          onClick={addToGoogle}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-300 disabled:opacity-50"
        >
          <Wallet className="h-4 w-4 text-brand-600" />
          {loading ? "Ouverture…" : "Ajouter à Google Wallet"}
        </button>
      </div>
    </div>
  );
}
