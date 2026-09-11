import type { GeneratorDef } from "./types";

/**
 * A stylised, representative GB generation fleet — not a literal list of
 * real power stations, but scaled so the merit order, totals and clearing
 * price behave the way the real GB system does.
 *
 * Includes two HVDC interconnectors (France, Norway) as import-only supply
 * sources — real GB interconnectors can flow either direction, but this sim
 * only models importing, which is enough to teach the two things that
 * matter: they compete in the merit order like any other source, and,
 * being power-electronic links rather than spinning machines, they
 * contribute zero natural inertia — same category as wind, solar and
 * batteries.
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
    position: [-34, 0, -3],
  },
  {
    id: "wind",
    name: "Offshore & onshore wind",
    type: "wind",
    capacityMW: 15000,
    srmc: 2,
    inertiaFactor: 0,
    rampRateMWps: 3000,
    position: [-29, 0, -3],
  },
  {
    id: "solar",
    name: "Solar farms",
    type: "solar",
    capacityMW: 14000,
    srmc: 1,
    inertiaFactor: 0,
    rampRateMWps: 4000,
    position: [-24, 0, -3],
  },
  {
    id: "hydro",
    name: "Hydro",
    type: "hydro",
    capacityMW: 2000,
    srmc: 20,
    inertiaFactor: 0.6,
    rampRateMWps: 200,
    position: [-19, 0, -3],
  },
  {
    id: "ccgt-a",
    name: "Gas CCGT (efficient)",
    type: "ccgt",
    capacityMW: 10000,
    srmc: 58,
    inertiaFactor: 0.7,
    rampRateMWps: 120,
    position: [-34, 0, 3],
  },
  {
    id: "ccgt-b",
    name: "Gas CCGT (older)",
    type: "ccgt",
    capacityMW: 8000,
    srmc: 78,
    inertiaFactor: 0.7,
    rampRateMWps: 100,
    position: [-29, 0, 3],
  },
  {
    id: "peaker",
    name: "Gas peakers (OCGT)",
    type: "peaker",
    capacityMW: 5000,
    srmc: 165,
    inertiaFactor: 0.4,
    rampRateMWps: 400,
    position: [-24, 0, 3],
  },
  {
    id: "battery",
    name: "Battery storage",
    type: "battery",
    capacityMW: 2000,
    srmc: 0,
    inertiaFactor: 0,
    rampRateMWps: 2000,
    position: [-19, 0, 3],
  },
  {
    id: "interconnector-fr",
    name: "Interconnector — France",
    type: "interconnector",
    capacityMW: 2000,
    srmc: 42,
    inertiaFactor: 0,
    rampRateMWps: 800,
    position: [-13, 0, -6],
    country: "France",
  },
  {
    id: "interconnector-no",
    name: "Interconnector — Norway",
    type: "interconnector",
    capacityMW: 1400,
    srmc: 36,
    inertiaFactor: 0,
    rampRateMWps: 800,
    position: [-13, 0, 6],
    country: "Norway",
  },
];

export const TOTAL_CAPACITY_MW = GENERATORS.reduce(
  (sum, g) => sum + g.capacityMW,
  0,
);
