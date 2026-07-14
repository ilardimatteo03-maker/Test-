import type { PlanId } from "./types";

// Limites par plan — la monétisation est câblée dès le départ.
export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // €/mois
  clientLimit: number; // Infinity pour illimité
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Découverte",
    price: 0,
    clientLimit: 30,
    features: [
      "Jusqu'à 30 clients",
      "1 carte de fidélité",
      "Page carte pour vos clients",
      "Statistiques de base",
      "Pour tester avant de se lancer",
    ],
  },
  pro: {
    id: "pro",
    name: "Fidélo Pro",
    price: 29,
    clientLimit: Infinity,
    highlight: true,
    features: [
      "Installé et configuré par ASM",
      "Clients illimités",
      "Récompenses personnalisées",
      "Statistiques avancées + export",
      "Accompagnement et support ASM",
    ],
  },
};

export function planLimitReached(plan: PlanId, clientCount: number): boolean {
  return clientCount >= PLANS[plan].clientLimit;
}
