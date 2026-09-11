import { demandAtHour, makeDailyCurve } from "./demandCurve";

export type ScenarioId = "calm" | "windDrought" | "coldSnap" | "heatwave" | "eclipse";

export interface ScenarioDef {
  id: ScenarioId;
  name: string;
  /** One-line description shown in the picker. */
  description: string;
  demandAtHour: (hour: number) => number;
  /** Wind availability 0..1 (fraction of nameplate) at a given hour — in
   *  scenario mode this replaces the manual wind slider entirely, since the
   *  point is to show a specific, named weather pattern rather than let the
   *  user dial in an arbitrary one. */
  windAvailability: (hour: number) => number;
  /** Multiplies nuclear's normal 0.96 availability — used for cooling-water
   *  constraints during a heatwave. Defaults to 1 (no extra derate). */
  nuclearDerate?: number;
  /** Multiplies ccgt/peaker availability — same cooling-constraint idea
   *  applied to thermal gas plant. Defaults to 1. */
  thermalDerate?: number;
  /** Hour-of-day the scenario starts playing from. Defaults to 0 (midnight)
   *  — most scenarios want to show the whole day including the overnight
   *  trough, but a scripted daytime event (the eclipse) needs to start
   *  when there's actually solar output to lose. */
  startHour?: number;
}

// Winter demand runs higher than the default (summer-ish) curve throughout,
// with a sharper, higher evening peak once heating load stacks on lighting/
// cooking — the classic GB winter shape.
const WINTER_KEY_POINTS: [number, number][] = [
  [0, 33000],
  [3, 28500],
  [5, 29500],
  [7, 40000],
  [9, 43000],
  [11, 40500],
  [13, 38500],
  [15, 39500],
  [17, 45500],
  [18, 47500],
  [19, 46500],
  [21, 41500],
  [23, 36000],
  [24, 33000],
];
const coldSnapDemand = makeDailyCurve(WINTER_KEY_POINTS);

// A daytime cooling bump layered on the normal curve — same overnight
// trough, but midday/afternoon runs well above the calm-day equivalent.
const HEATWAVE_KEY_POINTS: [number, number][] = [
  [0, 27000],
  [3, 22000],
  [5, 22500],
  [7, 31000],
  [9, 35000],
  [11, 38000],
  [13, 40500],
  [15, 41500],
  [17, 42500],
  [18, 44000],
  [19, 42500],
  [21, 37000],
  [23, 30500],
  [24, 27000],
];
const heatwaveDemand = makeDailyCurve(HEATWAVE_KEY_POINTS);

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  calm: {
    id: "calm",
    name: "Calm day",
    description: "Normal demand, full availability, no weather stress — the baseline everything else is compared against.",
    demandAtHour,
    windAvailability: () => 0.5,
  },
  windDrought: {
    id: "windDrought",
    name: "Wind drought (Dunkelflaute)",
    description: "Wind pinned low all day — gas and imports end up setting the price far more often than usual.",
    demandAtHour,
    windAvailability: () => 0.15,
  },
  coldSnap: {
    id: "coldSnap",
    name: "Cold snap + low wind",
    description: "Winter peak demand meets a stalled weather system — the most dangerous combination GB actually plans for.",
    demandAtHour: coldSnapDemand,
    windAvailability: () => 0.12,
  },
  heatwave: {
    id: "heatwave",
    name: "Summer heatwave",
    description: "Cooling-driven daytime demand bump, plus calmer air and cooling-water limits derating generation.",
    demandAtHour: heatwaveDemand,
    windAvailability: () => 0.2,
    nuclearDerate: 0.92,
    thermalDerate: 0.93,
  },
  eclipse: {
    id: "eclipse",
    name: "Solar eclipse",
    description: "A calm mid-morning, until a scripted total solar dip hits partway through — watch the frequency response.",
    demandAtHour,
    windAvailability: () => 0.5,
    startHour: 10.5,
  },
};

export const SCENARIO_ORDER: ScenarioId[] = ["calm", "windDrought", "coldSnap", "heatwave", "eclipse"];

/** Solar eclipse timing, as sim-clock seconds since the scenario started
 *  playing (not hour-of-day) — a real eclipse is a precisely timed, total
 *  event, not something that tracks sun position. */
export const ECLIPSE_START_S = 25;
export const ECLIPSE_TOTALITY_S = 8;
export const ECLIPSE_RECOVER_S = 12;
