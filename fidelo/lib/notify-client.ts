"use client";

// Déclenche (sans bloquer l'interface) l'email « récompense gagnée ».
// En démo ou sans clé Resend, la route répond 501 et rien ne part.
export function notifyReward(clientId: string) {
  try {
    fetch("/api/notify/reward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* jamais bloquant */
  }
}
