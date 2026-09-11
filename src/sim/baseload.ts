import { GENERATORS } from "./generators";
import { dispatch as economicDispatch } from "./dispatch";
import { demandAtHour, daylightFactor, DEMAND_FLOOR_MW } from "./demandCurve";
import type { FuelType } from "./types";

export { DEMAND_FLOOR_MW as BASELOAD_MW };

/** Bottom-to-top stacking order for the daily area chart — cheapest (most
 *  "baseload-like") first, so the flat band at the bottom is exactly what's
 *  running almost all the time, and the band that only appears at the top
 *  during evening peak is the peaker. Battery is excluded, same as the
 *  merit-order table (see dispatch.ts) — it doesn't compete on price here. */
export const STACK_ORDER: FuelType[] = [
  "nuclear",
  "wind",
  "solar",
  "hydro",
  "interconnector",
  "ccgt",
  "peaker",
];

export interface DailyProfilePoint {
  hour: number;
  demandMW: number;
  byFuel: Partial<Record<FuelType, number>>;
}

/**
 * Precomputes 24h of dispatch using the same merit-order logic as the live
 * sim, but with a fixed "typical day" availability profile (constant wind,
 * constant nuclear/hydro availability, solar following the sun) rather than
 * the user's live wind slider or weather scenarios — this is a reference
 * curve, not a replay of the current moment. Nuclear and wind end up
 * dispatched almost flat across all 24 points because they're cheapest and
 * demand never falls below what they alone can cover: that flat band *is*
 * the baseload. Gas peakers only enter the stack for the few hours around
 * the evening peak — exactly the "switched on a few days/hours a year"
 * story capacity market payments exist to solve.
 */
export function computeDailyProfile(stepHours = 0.5): DailyProfilePoint[] {
  const points: DailyProfilePoint[] = [];
  const availability = {
    nuclear: 0.96,
    wind: 0.55, // representative constant, not the live wind slider
    hydro: 0.7,
    "ccgt-a": 1,
    "ccgt-b": 1,
    peaker: 1,
    "interconnector-nordics": 1,
    "interconnector-europe": 1,
    "interconnector-ireland": 1,
  } as Record<string, number>;

  for (let h = 0; h <= 24; h += stepHours) {
    const demandMW = demandAtHour(h);
    const avail = { ...availability, solar: daylightFactor(h) };
    const { targets } = economicDispatch(demandMW, avail, new Set());
    const byFuel: Partial<Record<FuelType, number>> = {};
    for (const g of GENERATORS) {
      if (g.type === "battery") continue;
      byFuel[g.type] = (byFuel[g.type] ?? 0) + (targets[g.id] ?? 0);
    }
    points.push({ hour: h, demandMW, byFuel });
  }
  return points;
}

/** Typical real-world GB capacity factors (annual average output ÷ nameplate
 *  capacity) — reference figures, not computed from this sim's short demo
 *  window. Shown in the inspector to connect "runs almost never" to why
 *  peakers get paid to be *available* (Capacity Market) rather than to
 *  produce. */
export const TYPICAL_CAPACITY_FACTOR: Record<FuelType, string> = {
  nuclear: "~90%",
  wind: "~35% (offshore higher, onshore lower)",
  solar: "~11%",
  hydro: "~30%",
  ccgt: "~40%",
  peaker: "~2–5% — runs a handful of days a year",
  battery: "n/a — cycles daily, not a capacity factor story",
  interconnector: "varies with price spreads abroad",
};
