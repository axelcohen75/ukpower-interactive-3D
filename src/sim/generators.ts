import type { GeneratorDef } from "./types";

/**
 * A stylised, representative GB generation fleet — not a literal list of
 * real power stations, but scaled so the merit order, totals and clearing
 * price behave the way the real GB system does.
 */
export const GENERATORS: GeneratorDef[] = [
  {
    id: "nuclear",
    name: "Nuclear fleet",
    type: "nuclear",
    capacityMW: 5900,
    srmc: 6,
    inertiaFactor: 1,
    rampRateMWps: 5,
    position: [-16, 0, -10],
  },
  {
    id: "wind",
    name: "Offshore & onshore wind",
    type: "wind",
    capacityMW: 15000,
    srmc: 2,
    inertiaFactor: 0,
    rampRateMWps: Infinity,
    position: [-16, 0, -3],
  },
  {
    id: "solar",
    name: "Solar farms",
    type: "solar",
    capacityMW: 14000,
    srmc: 1,
    inertiaFactor: 0,
    rampRateMWps: Infinity,
    position: [-16, 0, 4],
  },
  {
    id: "hydro",
    name: "Hydro",
    type: "hydro",
    capacityMW: 2000,
    srmc: 20,
    inertiaFactor: 0.6,
    rampRateMWps: 200,
    position: [-16, 0, 11],
  },
  {
    id: "ccgt-a",
    name: "Gas CCGT (efficient)",
    type: "ccgt",
    capacityMW: 10000,
    srmc: 58,
    inertiaFactor: 0.7,
    rampRateMWps: 120,
    position: [-9, 0, -10],
  },
  {
    id: "ccgt-b",
    name: "Gas CCGT (older)",
    type: "ccgt",
    capacityMW: 8000,
    srmc: 78,
    inertiaFactor: 0.7,
    rampRateMWps: 100,
    position: [-9, 0, -3],
  },
  {
    id: "peaker",
    name: "Gas peakers (OCGT)",
    type: "peaker",
    capacityMW: 5000,
    srmc: 165,
    inertiaFactor: 0.4,
    rampRateMWps: 400,
    position: [-9, 0, 4],
  },
  {
    id: "battery",
    name: "Battery storage",
    type: "battery",
    capacityMW: 2000,
    srmc: 0,
    inertiaFactor: 0,
    rampRateMWps: 2000,
    position: [-9, 0, 11],
  },
];

export const TOTAL_CAPACITY_MW = GENERATORS.reduce(
  (sum, g) => sum + g.capacityMW,
  0,
);
