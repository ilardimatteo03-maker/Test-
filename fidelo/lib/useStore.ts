"use client";

import { useSyncExternalStore } from "react";
import { getVersion, subscribe } from "./store";

// Renvoie un numéro de version qui change à chaque mutation du store.
// Les composants l'utilisent comme signal pour recalculer leurs données —
// on évite ainsi les boucles liées aux snapshots d'identité changeante.
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, () => 0);
}
