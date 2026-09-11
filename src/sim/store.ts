import { create } from "zustand";
import { GENERATORS, TOTAL_CAPACITY_MW } from "./generators";
import { dispatch as economicDispatch } from "./dispatch";
import { demandAtHour, daylightFactor } from "./demandCurve";
import type { DemandMode, GeneratorState } from "./types";

const TARGET_FREQ_HZ = 50;
// Tuned constants for a *felt-right*, not dimensionally rigorous, physics feel.
const INERTIA_K = 0.9; // scales rate-of-change-of-frequency from imbalance/inertia
const RESTORING_GAIN = 0.12; // per second: droop/AGC pulling freq back toward 50 Hz
const SIM_SPEED_DAY_CYCLE = 0.12; // hours of sim-day advanced per real second
const CLOUD_DURATION_S = 14;
const CLOUD_SOLAR_FACTOR = 0.12;

const INERTIA_FACTOR_BY_ID: Record<string, number> = Object.fromEntries(
  GENERATORS.map((g) => [g.id, g.inertiaFactor]),
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

interface SimState {
  demandMode: DemandMode;
  manualDemandMW: number;
  hourOfDay: number;

  windFactor: number; // 0..1, user-controlled "how windy is it"
  cloud: { active: boolean; timeRemaining: number };

  generators: Record<string, GeneratorState>;
  trippedIds: Set<string>;
  batteryRespondingUntil: number; // sim-seconds timestamp; 0 = idle

  frequencyHz: number;
  rocofHzPerS: number;
  demandMW: number;
  totalSupplyMW: number;
  clearingPriceGBPPerMWh: number;
  marginalGeneratorId: string | null;

  simClockS: number;
  paused: boolean;

  setDemandMode: (mode: DemandMode) => void;
  setManualDemand: (mw: number) => void;
  setHourOfDay: (h: number) => void;
  setWindFactor: (f: number) => void;
  triggerCloud: () => void;
  tripGenerator: (id: string) => void;
  restartGenerator: (id: string) => void;
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
  batteryRespondingUntil: 0,

  frequencyHz: 50,
  rocofHzPerS: 0,
  demandMW: 34000,
  totalSupplyMW: 0,
  clearingPriceGBPPerMWh: 0,
  marginalGeneratorId: null,

  simClockS: 0,
  paused: false,

  setDemandMode: (mode) => set({ demandMode: mode }),
  setManualDemand: (mw) => set({ manualDemandMW: mw }),
  setHourOfDay: (h) => set({ hourOfDay: ((h % 24) + 24) % 24 }),
  setWindFactor: (f) => set({ windFactor: Math.min(1, Math.max(0, f)) }),

  triggerCloud: () =>
    set({ cloud: { active: true, timeRemaining: CLOUD_DURATION_S } }),

  tripGenerator: (id) =>
    set((s) => {
      const trippedIds = new Set(s.trippedIds);
      trippedIds.add(id);
      const generators = { ...s.generators };
      generators[id] = { ...generators[id], tripped: true, targetMW: 0 };
      return {
        trippedIds,
        generators,
        batteryRespondingUntil: s.simClockS + 20,
      };
    }),

  restartGenerator: (id) =>
    set((s) => {
      const trippedIds = new Set(s.trippedIds);
      trippedIds.delete(id);
      const generators = { ...s.generators };
      generators[id] = { ...generators[id], tripped: false };
      return { trippedIds, generators };
    }),

  reset: () =>
    set({
      demandMode: "manual",
      manualDemandMW: 34000,
      hourOfDay: 12,
      windFactor: 0.5,
      cloud: { active: false, timeRemaining: 0 },
      generators: initialGeneratorStates(),
      trippedIds: new Set(),
      batteryRespondingUntil: 0,
      frequencyHz: 50,
      rocofHzPerS: 0,
      clearingPriceGBPPerMWh: 0,
      marginalGeneratorId: null,
      simClockS: 0,
    }),

  setPaused: (p) => set({ paused: p }),

  tick: (dtRealS) => {
    const s = get();
    if (s.paused) return;
    const dt = Math.min(dtRealS, 0.25); // guard against huge frame gaps

    let hourOfDay = s.hourOfDay;
    if (s.demandMode === "dayCycle") {
      hourOfDay = (hourOfDay + dt * SIM_SPEED_DAY_CYCLE) % 24;
    }

    const demandMW =
      s.demandMode === "dayCycle" ? demandAtHour(hourOfDay) : s.manualDemandMW;

    // --- cloud scenario timer ---
    let cloud = s.cloud;
    if (cloud.active) {
      const timeRemaining = cloud.timeRemaining - dt;
      cloud = timeRemaining > 0 ? { active: true, timeRemaining } : { active: false, timeRemaining: 0 };
    }

    // --- availability by weather / time of day ---
    const sunFactor = s.demandMode === "dayCycle" ? daylightFactor(hourOfDay) : 0.85;
    const solarFactor = (cloud.active ? CLOUD_SOLAR_FACTOR : 1) * sunFactor;
    const availability: Record<string, number> = {
      nuclear: 0.96,
      wind: 0.15 + s.windFactor * 0.8,
      solar: solarFactor,
      hydro: 0.7,
      "ccgt-a": 1,
      "ccgt-b": 1,
      peaker: 1,
      battery: 1,
    };

    const { targets, clearingPriceGBPPerMWh, marginalGeneratorId } =
      economicDispatch(demandMW, availability, s.trippedIds);

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
      } else if (!Number.isFinite(g.rampRateMWps)) {
        actualMW = target;
      } else {
        const maxStep = g.rampRateMWps * dt;
        const diff = target - actualMW;
        actualMW += Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
      }
      if (s.trippedIds.has(g.id)) actualMW = Math.max(0, actualMW - g.rampRateMWps * dt * 4);

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

    // --- battery fast-frequency-response, only while actively responding ---
    const batteryDef = GENERATORS.find((g) => g.id === "battery")!;
    const responding = s.batteryRespondingUntil > s.simClockS;
    const imbalanceBeforeBattery = totalSupplyMW - demandMW;
    if (responding && imbalanceBeforeBattery < -50) {
      const need = Math.min(batteryDef.capacityMW, -imbalanceBeforeBattery);
      const prev = generators["battery"].actualMW;
      const maxStep = batteryDef.rampRateMWps * dt;
      const diff = need - prev;
      const actualMW = prev + Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
      generators["battery"] = {
        ...generators["battery"],
        targetMW: need,
        actualMW,
        online: actualMW > 1,
      };
      totalSupplyMW += actualMW - prev;
    } else if (generators["battery"].actualMW > 1) {
      const prev = generators["battery"].actualMW;
      const maxStep = batteryDef.rampRateMWps * dt;
      const actualMW = Math.max(0, prev - maxStep);
      generators["battery"] = { ...generators["battery"], targetMW: 0, actualMW };
      totalSupplyMW += actualMW - prev;
    }

    // --- frequency physics ---
    const imbalanceMW = totalSupplyMW - demandMW;
    let totalInertiaMW = 0;
    for (const g of GENERATORS) {
      if (generators[g.id].online) {
        totalInertiaMW += g.capacityMW * (INERTIA_FACTOR_BY_ID[g.id] ?? 0);
      }
    }
    const rocofHzPerS =
      (imbalanceMW / Math.max(totalInertiaMW, 1000)) * INERTIA_K;

    let frequencyHz = s.frequencyHz + rocofHzPerS * dt;
    frequencyHz += -(frequencyHz - TARGET_FREQ_HZ) * RESTORING_GAIN * dt;
    frequencyHz = Math.min(52, Math.max(48, frequencyHz));

    set({
      hourOfDay,
      cloud,
      generators,
      demandMW,
      totalSupplyMW,
      clearingPriceGBPPerMWh,
      marginalGeneratorId,
      frequencyHz,
      rocofHzPerS,
      simClockS: s.simClockS + dt,
    });
  },
}));

export { TOTAL_CAPACITY_MW };
