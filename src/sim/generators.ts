import type { GeneratorDef } from "./types";

/**
 * A stylised, representative GB generation fleet — not a literal list of
 * real power stations, but scaled so the merit order, totals and clearing
 * price behave the way the real GB system does.
 *
 * GB actually runs 9 HVDC interconnectors to 6 countries (~9.8GW combined):
 * 3 to France (IFA, IFA2, ElecLink), BritNed to the Netherlands, Nemo Link
 * to Belgium, Viking Link to Denmark, North Sea Link to Norway, and Moyle +
 * EWIC to Ireland. Modelling all 9 separately would clutter the scene for
 * no teaching benefit, so they're grouped into 3 real geographic clusters
 * (Nordics / Western Europe / Ireland) at their true combined capacity and
 * a representative blended price — see interconnector definitions below
 * for exactly which real links each one stands in for.
 *
 * Import-only for simplicity — real interconnectors flow either direction,
 * but modelling import is enough to teach what matters: they compete in
 * the merit order like any other source, and, being power-electronic
 * links rather than spinning machines, contribute zero natural inertia —
 * same category as wind, solar and batteries.
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
    id: "interconnector-nordics",
    name: "Interconnector — Nordics",
    type: "interconnector",
    capacityMW: 2800,
    srmc: 39,
    inertiaFactor: 0,
    rampRateMWps: 900,
    position: [-13, 0, -7],
    countries: ["Norway", "Denmark"],
    realLinks: "North Sea Link to Norway (1400MW) + Viking Link to Denmark (1400MW)",
  },
  {
    id: "interconnector-europe",
    name: "Interconnector — Western Europe",
    type: "interconnector",
    capacityMW: 6000,
    srmc: 46,
    inertiaFactor: 0,
    rampRateMWps: 900,
    position: [-13, 0, 0],
    countries: ["France", "Netherlands", "Belgium"],
    realLinks: "IFA + IFA2 + ElecLink to France (4000MW) + BritNed to Netherlands (1000MW) + Nemo Link to Belgium (1000MW)",
  },
  {
    id: "interconnector-ireland",
    name: "Interconnector — Ireland",
    type: "interconnector",
    capacityMW: 1000,
    srmc: 51,
    inertiaFactor: 0,
    rampRateMWps: 900,
    position: [-13, 0, 7],
    countries: ["Ireland"],
    realLinks: "Moyle (500MW) + EWIC (500MW)",
  },
];

export const TOTAL_CAPACITY_MW = GENERATORS.reduce(
  (sum, g) => sum + g.capacityMW,
  0,
);
