import { create } from "zustand";
import { GENERATORS, TOTAL_CAPACITY_MW } from "./generators";
import { dispatch as economicDispatch } from "./dispatch";
import { demandAtHour, daylightFactor } from "./demandCurve";
import {
  LFDD_CUMULATIVE_PCT,
  LFDD_SHED_ORDER,
  isBlockShed,
} from "../data/cityLayout";
import {
  COLLAPSE_THRESHOLD_HZ,
  LFDD_STAGES,
  OVERFREQ_TRIP_DWELL_S,
  OVERFREQ_TRIP_THRESHOLD,
} from "./frequencyBands";
import type { DemandMode, GeneratorState, SystemState } from "./types";

export { isBlockShed };

const TARGET_FREQ_HZ = 50;
// Tuned so the same MW imbalance swings frequency much faster when little
// synchronous (spinning) plant is online — the core RoCoF/inertia lesson.
const INERTIA_K = 1.1;
// A light governor-droop restoring force, always present from any online
// synchronous plant — real, but weak. The heavy lifting during a real event
// is done by primary response (battery), LFDD shedding, and redispatch, not
// this term, so it must not be strong enough to mask the failure states.
const GOVERNOR_DROOP_GAIN = 0.02;
const SIM_SPEED_DAY_CYCLE = 0.12; // hours of sim-day advanced per real second
const CLOUD_DURATION_S = 14;
const CLOUD_SOLAR_FACTOR = 0.12;
// The real 9 Aug 2019 event: Hornsea wind and Little Barford gas dropped
// near-simultaneously — small relative to GB's ~60GW system, but enough to
// hit 48.8 Hz in about 4 seconds because system inertia was already low
// that day. Our fleet is far smaller (a handful of aggregate plants, not
// GB's full generator roster) with correspondingly less headroom, so this
// is scaled up from the real ~900/700MW to land on the same ~4s-to-LFDD1
// timing at typical demand/wind settings, whatever they are — not a
// literal MW replica.
const AUG2019_WIND_LOSS_MW = 4500;
const AUG2019_GAS_LOSS_MW = 3000;
const LFDD_RESTORE_HOLD_S = 6; // freq must hold above this-and-stable for this long
const LFDD_RESTORE_STAGE_GAP_S = 4; // then stages reconnect one at a time
const LFDD_RESTORE_FREQ_HZ = 49.6;
const OVERFREQ_TRIP_COOLDOWN_S = 18;

export interface BlackStartStepDef {
  label: string;
  durationS: number;
}

export const BLACK_START_STEPS: BlackStartStepDef[] = [
  { label: "Grid-forming battery stabilises a local island", durationS: 3 },
  { label: "Starting hydro (self-start capable)", durationS: 4 },
  { label: "Starting gas peakers from local supply", durationS: 4 },
  { label: "Starting gas CCGT plants", durationS: 5 },
  { label: "Reconnecting Grid Supply Point: North", durationS: 3 },
  { label: "Reconnecting Grid Supply Point: Central", durationS: 3 },
  { label: "Reconnecting Grid Supply Point: South", durationS: 3 },
  { label: "Bringing the nuclear fleet back online", durationS: 6 },
  { label: "Stabilising system frequency at 50.00 Hz", durationS: 4 },
];

const INERTIA_FACTOR_BY_ID: Record<string, number> = Object.fromEntries(
  GENERATORS.map((g) => [g.id, g.inertiaFactor]),
);
const GEN_BY_ID: Record<string, (typeof GENERATORS)[number]> = Object.fromEntries(
  GENERATORS.map((g) => [g.id, g]),
);

function initialGeneratorStates(): Record<string, GeneratorState> {
  const out: Record<string, GeneratorState> = {};
  for (const g of GENERATORS) {
    out[g.id] = {
      id: g.id,
      targetMW: 0,
      actualMW: 0,
      availableMW: g.capacityMW,
      online: false,
      tripped: false,
    };
  }
  return out;
}

function rampToward(actualMW: number, target: number, rampRateMWps: number, dt: number): number {
  if (!Number.isFinite(rampRateMWps)) return target;
  const maxStep = rampRateMWps * dt;
  const diff = target - actualMW;
  return actualMW + Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
}

interface SimState {
  demandMode: DemandMode;
  manualDemandMW: number;
  hourOfDay: number;

  windFactor: number; // 0..1, user-controlled "how windy is it"
  cloud: { active: boolean; timeRemaining: number };

  generators: Record<string, GeneratorState>;
  trippedIds: Set<string>;

  frequencyHz: number;
  rocofHzPerS: number;
  demandMW: number;
  effectiveDemandMW: number;
  totalSupplyMW: number;
  clearingPriceGBPPerMWh: number;
  marginalGeneratorId: string | null;

  activeLfddStages: number; // 0-9
  lfddStableSinceS: number | null;
  lfddRestoreCooldownUntilS: number;

  overFreqAboveSinceS: number | null;
  overFreqTrip: { active: boolean; factor: number; untilS: number };
  overFreqCooldownUntilS: number;

  systemState: SystemState;
  blackStart: { stepIndex: number; stepStartedS: number } | null;

  simClockS: number;
  paused: boolean;

  setDemandMode: (mode: DemandMode) => void;
  setManualDemand: (mw: number) => void;
  setHourOfDay: (h: number) => void;
  setWindFactor: (f: number) => void;
  triggerCloud: () => void;
  triggerDemandDrop: () => void;
  triggerAug2019: () => void;
  tripGenerator: (id: string) => void;
  restartGenerator: (id: string) => void;
  beginBlackStart: () => void;
  reset: () => void;
  setPaused: (p: boolean) => void;
  tick: (dtRealS: number) => void;
}

export const useSimStore = create<SimState>((set, get) => ({
  demandMode: "manual",
  manualDemandMW: 34000,
  hourOfDay: 12,

  windFactor: 0.5,
  cloud: { active: false, timeRemaining: 0 },

  generators: initialGeneratorStates(),
  trippedIds: new Set(),

  frequencyHz: 50,
  rocofHzPerS: 0,
  demandMW: 34000,
  effectiveDemandMW: 34000,
  totalSupplyMW: 0,
  clearingPriceGBPPerMWh: 0,
  marginalGeneratorId: null,

  activeLfddStages: 0,
  lfddStableSinceS: null,
  lfddRestoreCooldownUntilS: 0,

  overFreqAboveSinceS: null,
  overFreqTrip: { active: false, factor: 0, untilS: 0 },
  overFreqCooldownUntilS: 0,

  systemState: "normal",
  blackStart: null,

  simClockS: 0,
  paused: false,

  setDemandMode: (mode) => set({ demandMode: mode }),
  setManualDemand: (mw) => set({ manualDemandMW: mw }),
  setHourOfDay: (h) => set({ hourOfDay: ((h % 24) + 24) % 24 }),
  setWindFactor: (f) => set({ windFactor: Math.min(1, Math.max(0, f)) }),

  triggerCloud: () =>
    set({ cloud: { active: true, timeRemaining: CLOUD_DURATION_S } }),

  triggerDemandDrop: () =>
    set((s) => ({
      demandMode: "manual",
      manualDemandMW: Math.max(12000, s.manualDemandMW - 9000),
    })),

  triggerAug2019: () =>
    set((s) => {
      const generators = { ...s.generators };
      generators["wind"] = {
        ...generators["wind"],
        actualMW: Math.max(0, generators["wind"].actualMW - AUG2019_WIND_LOSS_MW),
      };
      generators["ccgt-a"] = {
        ...generators["ccgt-a"],
        actualMW: Math.max(0, generators["ccgt-a"].actualMW - AUG2019_GAS_LOSS_MW),
      };
      return { generators };
    }),

  tripGenerator: (id) =>
    set((s) => {
      const trippedIds = new Set(s.trippedIds);
      trippedIds.add(id);
      const generators = { ...s.generators };
      generators[id] = { ...generators[id], tripped: true, targetMW: 0 };
      return { trippedIds, generators };
    }),

  restartGenerator: (id) =>
    set((s) => {
      const trippedIds = new Set(s.trippedIds);
      trippedIds.delete(id);
      const generators = { ...s.generators };
      generators[id] = { ...generators[id], tripped: false };
      return { trippedIds, generators };
    }),

  beginBlackStart: () =>
    set((s) => ({
      systemState: "blackstart",
      blackStart: { stepIndex: 0, stepStartedS: s.simClockS },
    })),

  reset: () =>
    set({
      demandMode: "manual",
      manualDemandMW: 34000,
      hourOfDay: 12,
      windFactor: 0.5,
      cloud: { active: false, timeRemaining: 0 },
      generators: initialGeneratorStates(),
      trippedIds: new Set(),
      frequencyHz: 50,
      rocofHzPerS: 0,
      clearingPriceGBPPerMWh: 0,
      marginalGeneratorId: null,
      activeLfddStages: 0,
      lfddStableSinceS: null,
      lfddRestoreCooldownUntilS: 0,
      overFreqAboveSinceS: null,
      overFreqTrip: { active: false, factor: 0, untilS: 0 },
      overFreqCooldownUntilS: 0,
      systemState: "normal",
      blackStart: null,
      simClockS: 0,
    }),

  setPaused: (p) => set({ paused: p }),

  tick: (dtRealS) => {
    const s = get();
    if (s.paused) return;
    const dt = Math.min(dtRealS, 0.25); // guard against huge frame gaps
    const simClockS = s.simClockS + dt;

    // ============================================================
    // COLLAPSED: everything frozen dark until the user runs Black Start.
    // ============================================================
    if (s.systemState === "collapsed") {
      set({ simClockS });
      return;
    }

    // ============================================================
    // BLACK START: a scripted recovery sequence overrides normal physics.
    // ============================================================
    if (s.systemState === "blackstart" && s.blackStart) {
      const stepIndex = s.blackStart.stepIndex;
      const step = BLACK_START_STEPS[stepIndex];
      const elapsed = simClockS - s.blackStart.stepStartedS;
      const stepProgress = Math.min(1, elapsed / step.durationS);

      const bsTargets: Record<string, number> = {};
      for (const g of GENERATORS) bsTargets[g.id] = 0;
      if (stepIndex >= 0) bsTargets["battery"] = 400;
      if (stepIndex >= 1) bsTargets["hydro"] = 1200;
      if (stepIndex >= 2) bsTargets["peaker"] = 1500;
      if (stepIndex >= 3) bsTargets["ccgt-a"] = 4000;
      if (stepIndex >= 7) bsTargets["nuclear"] = GEN_BY_ID["nuclear"].capacityMW * 0.96;

      const generators: Record<string, GeneratorState> = {};
      for (const g of GENERATORS) {
        const prev = s.generators[g.id];
        const actualMW = rampToward(prev.actualMW, bsTargets[g.id], g.rampRateMWps, dt);
        generators[g.id] = {
          id: g.id,
          targetMW: bsTargets[g.id],
          actualMW,
          availableMW: g.capacityMW,
          online: actualMW > 1,
          tripped: false,
        };
      }

      let activeLfddStages = s.activeLfddStages;
      if (stepIndex === 4) activeLfddStages = Math.max(6, 9 - Math.floor(3 * stepProgress));
      else if (stepIndex === 5) activeLfddStages = Math.max(3, 6 - Math.floor(3 * stepProgress));
      else if (stepIndex === 6) activeLfddStages = Math.max(0, 3 - Math.floor(3 * stepProgress));
      else if (stepIndex > 6) activeLfddStages = 0;

      let frequencyHz = s.frequencyHz;
      if (stepIndex === 8) {
        frequencyHz += -(frequencyHz - TARGET_FREQ_HZ) * 2.0 * dt;
      }

      if (elapsed >= step.durationS) {
        if (stepIndex + 1 >= BLACK_START_STEPS.length) {
          // Recovery complete.
          set({
            simClockS,
            generators,
            activeLfddStages: 0,
            systemState: "normal",
            blackStart: null,
            demandMode: "manual",
            manualDemandMW: 28000,
            trippedIds: new Set(),
            frequencyHz: 50,
            rocofHzPerS: 0,
            lfddStableSinceS: null,
            overFreqAboveSinceS: null,
            overFreqTrip: { active: false, factor: 0, untilS: 0 },
          });
          return;
        }
        set({
          simClockS,
          generators,
          activeLfddStages,
          frequencyHz,
          blackStart: { stepIndex: stepIndex + 1, stepStartedS: simClockS },
        });
        return;
      }

      set({ simClockS, generators, activeLfddStages, frequencyHz });
      return;
    }

    // ============================================================
    // NORMAL OPERATION
    // ============================================================
    let hourOfDay = s.hourOfDay;
    if (s.demandMode === "dayCycle") {
      hourOfDay = (hourOfDay + dt * SIM_SPEED_DAY_CYCLE) % 24;
    }

    const demandMW =
      s.demandMode === "dayCycle" ? demandAtHour(hourOfDay) : s.manualDemandMW;

    const shedPct = s.activeLfddStages > 0 ? LFDD_CUMULATIVE_PCT[s.activeLfddStages - 1] : 0;
    const effectiveDemandMW = demandMW * (1 - shedPct / 100);

    // --- scenario timers ---
    let cloud = s.cloud;
    if (cloud.active) {
      const timeRemaining = cloud.timeRemaining - dt;
      cloud = timeRemaining > 0 ? { active: true, timeRemaining } : { active: false, timeRemaining: 0 };
    }
    // --- overfrequency self-protective tripping (mirror of LFDD) ---
    let overFreqTrip = s.overFreqTrip;
    if (overFreqTrip.active && simClockS >= overFreqTrip.untilS) {
      overFreqTrip = { active: false, factor: 0, untilS: 0 };
    }
    let overFreqAboveSinceS = s.overFreqAboveSinceS;
    let overFreqCooldownUntilS = s.overFreqCooldownUntilS;
    if (s.frequencyHz > OVERFREQ_TRIP_THRESHOLD) {
      if (overFreqAboveSinceS === null) overFreqAboveSinceS = simClockS;
      if (
        !overFreqTrip.active &&
        simClockS >= overFreqCooldownUntilS &&
        simClockS - overFreqAboveSinceS >= OVERFREQ_TRIP_DWELL_S
      ) {
        const factor = 0.15 + Math.random() * 0.2;
        overFreqTrip = { active: true, factor, untilS: simClockS + 15 + Math.random() * 10 };
        overFreqCooldownUntilS = simClockS + OVERFREQ_TRIP_COOLDOWN_S;
        overFreqAboveSinceS = null;
      }
    } else {
      overFreqAboveSinceS = null;
    }

    // --- availability by weather / time of day / failure modes ---
    const sunFactor = s.demandMode === "dayCycle" ? daylightFactor(hourOfDay) : 0.85;
    const solarFactor = (cloud.active ? CLOUD_SOLAR_FACTOR : 1) * sunFactor * (overFreqTrip.active ? 1 - overFreqTrip.factor : 1);
    const windAvailFactor = (0.15 + s.windFactor * 0.8) * (overFreqTrip.active ? 1 - overFreqTrip.factor : 1);
    const availability: Record<string, number> = {
      nuclear: 0.96,
      wind: windAvailFactor,
      solar: solarFactor,
      hydro: 0.7,
      "ccgt-a": 1,
      "ccgt-b": 1,
      peaker: 1,
      battery: 1,
    };

    const { targets, clearingPriceGBPPerMWh, marginalGeneratorId } =
      economicDispatch(effectiveDemandMW, availability, s.trippedIds);

    // --- ramp actual output toward target per generator ---
    const isFirstTick = s.simClockS === 0;
    const generators: Record<string, GeneratorState> = {};
    let totalSupplyMW = 0;
    for (const g of GENERATORS) {
      const prev = s.generators[g.id];
      const target = s.trippedIds.has(g.id) ? 0 : targets[g.id] ?? 0;
      let actualMW = prev.actualMW;
      if (isFirstTick) {
        // Start from steady state, not a cold black-start — the plants are
        // already running when the page loads.
        actualMW = target;
      } else {
        actualMW = rampToward(actualMW, target, g.rampRateMWps, dt);
      }
      if (s.trippedIds.has(g.id) && g.id !== "battery")
        actualMW = Math.max(0, actualMW - g.rampRateMWps * dt * 4);

      totalSupplyMW += actualMW;
      generators[g.id] = {
        id: g.id,
        targetMW: target,
        actualMW,
        availableMW: g.capacityMW * (availability[g.id] ?? 1),
        online: actualMW > 1,
        tripped: s.trippedIds.has(g.id),
      };
    }

    // --- primary frequency response: battery engages automatically on any
    //     meaningful under-frequency, not just after a specific scenario ---
    const batteryDef = GEN_BY_ID["battery"];
    const imbalanceBeforeBattery = totalSupplyMW - effectiveDemandMW;
    const needsPrimaryResponse = s.frequencyHz < 49.85 || imbalanceBeforeBattery < -100;
    if (needsPrimaryResponse && imbalanceBeforeBattery < -50) {
      const need = Math.min(batteryDef.capacityMW, -imbalanceBeforeBattery);
      const prev = generators["battery"].actualMW;
      const actualMW = rampToward(prev, need, batteryDef.rampRateMWps, dt);
      generators["battery"] = { ...generators["battery"], targetMW: need, actualMW, online: actualMW > 1 };
      totalSupplyMW += actualMW - prev;
    } else if (generators["battery"].actualMW > 1) {
      const prev = generators["battery"].actualMW;
      const actualMW = rampToward(prev, 0, batteryDef.rampRateMWps, dt);
      generators["battery"] = { ...generators["battery"], targetMW: 0, actualMW };
      totalSupplyMW += actualMW - prev;
    }

    // --- frequency physics: RoCoF driven by imbalance / online inertia ---
    const imbalanceMW = totalSupplyMW - effectiveDemandMW;
    let totalInertiaMW = 0;
    for (const g of GENERATORS) {
      if (generators[g.id].online) {
        totalInertiaMW += g.capacityMW * (INERTIA_FACTOR_BY_ID[g.id] ?? 0);
      }
    }
    const rocofHzPerS = (imbalanceMW / Math.max(totalInertiaMW, 800)) * INERTIA_K;

    let frequencyHz = s.frequencyHz + rocofHzPerS * dt;
    frequencyHz += -(frequencyHz - TARGET_FREQ_HZ) * GOVERNOR_DROOP_GAIN * dt;
    frequencyHz = Math.min(52, Math.max(46.5, frequencyHz));

    // --- collapse check ---
    if (frequencyHz <= COLLAPSE_THRESHOLD_HZ) {
      set({
        simClockS,
        hourOfDay,
        cloud,
        generators,
        demandMW,
        effectiveDemandMW,
        totalSupplyMW,
        clearingPriceGBPPerMWh,
        marginalGeneratorId,
        frequencyHz,
        rocofHzPerS,
        activeLfddStages: 9,
        overFreqTrip,
        overFreqAboveSinceS,
        overFreqCooldownUntilS,
        systemState: "collapsed",
      });
      return;
    }

    // --- LFDD: staged automatic demand disconnection ---
    let activeLfddStages = s.activeLfddStages;
    while (activeLfddStages < 9 && frequencyHz <= LFDD_STAGES[activeLfddStages].thresholdHz) {
      activeLfddStages++;
    }

    let lfddStableSinceS = s.lfddStableSinceS;
    let lfddRestoreCooldownUntilS = s.lfddRestoreCooldownUntilS;
    if (activeLfddStages > 0) {
      if (frequencyHz >= LFDD_RESTORE_FREQ_HZ) {
        if (lfddStableSinceS === null) lfddStableSinceS = simClockS;
        if (
          simClockS - lfddStableSinceS >= LFDD_RESTORE_HOLD_S &&
          simClockS >= lfddRestoreCooldownUntilS
        ) {
          activeLfddStages--;
          lfddRestoreCooldownUntilS = simClockS + LFDD_RESTORE_STAGE_GAP_S;
        }
      } else {
        lfddStableSinceS = null;
      }
    } else {
      lfddStableSinceS = null;
    }

    set({
      simClockS,
      hourOfDay,
      cloud,
      generators,
      demandMW,
      effectiveDemandMW,
      totalSupplyMW,
      clearingPriceGBPPerMWh,
      marginalGeneratorId,
      frequencyHz,
      rocofHzPerS,
      activeLfddStages,
      lfddStableSinceS,
      lfddRestoreCooldownUntilS,
      overFreqTrip,
      overFreqAboveSinceS,
      overFreqCooldownUntilS,
    });
  },
}));

export { TOTAL_CAPACITY_MW, LFDD_SHED_ORDER };
