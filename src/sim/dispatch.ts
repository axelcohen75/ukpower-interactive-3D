import { GENERATORS } from "./generators";
import type { FuelType } from "./types";

export interface AvailabilityMap {
  [generatorId: string]: number; // 0..1 fraction of capacity available right now
}

export interface DispatchResult {
  targets: Record<string, number>; // MW target per generator id
  clearingPriceGBPPerMWh: number;
  marginalGeneratorId: string | null;
  totalDispatchedMW: number;
}

/**
 * Cheapest-first economic dispatch (the "merit order"). Battery storage is
 * excluded from this specific dispatch step — not because real batteries
 * don't bid: GB batteries actively bid wholesale (arbitrage), the Balancing
 * Mechanism, the Capacity Market, and especially frequency response, where
 * their millisecond reaction time beats any thermal plant. This sim only
 * models that last role (triggered separately, see store.ts) to keep the
 * merit-order demo legible — a simplification of the sim, not of reality.
 */
export function dispatch(
  demandMW: number,
  availability: AvailabilityMap,
  trippedIds: Set<string>,
): DispatchResult {
  const dispatchable = GENERATORS.filter(
    (g) => g.type !== "battery" && !trippedIds.has(g.id),
  ).sort((a, b) => a.srmc - b.srmc);

  const targets: Record<string, number> = {};
  for (const g of GENERATORS) targets[g.id] = 0;

  let remaining = demandMW;
  let marginalGeneratorId: string | null = null;
  let clearingPriceGBPPerMWh = 0;
  let totalDispatchedMW = 0;

  for (const g of dispatchable) {
    if (remaining <= 0) break;
    const available = g.capacityMW * (availability[g.id] ?? 1);
    const take = Math.min(available, remaining);
    if (take > 0) {
      targets[g.id] = take;
      totalDispatchedMW += take;
      remaining -= take;
      marginalGeneratorId = g.id;
      clearingPriceGBPPerMWh = g.srmc;
    }
  }

  return { targets, clearingPriceGBPPerMWh, marginalGeneratorId, totalDispatchedMW };
}

export const FUEL_LABEL: Record<FuelType, string> = {
  nuclear: "Nuclear",
  wind: "Wind",
  solar: "Solar",
  hydro: "Hydro",
  ccgt: "Gas (CCGT)",
  peaker: "Gas peaker (OCGT)",
  battery: "Battery",
  interconnector: "Interconnector",
};

export const FUEL_COLOR: Record<FuelType, string> = {
  nuclear: "#f2c744",
  wind: "#4fd1c5",
  solar: "#f6ad55",
  hydro: "#4299e1",
  ccgt: "#a0aec0",
  peaker: "#fc8181",
  battery: "#9f7aea",
  interconnector: "#818cf8",
};
