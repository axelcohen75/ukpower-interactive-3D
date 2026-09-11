import { LFDD_CUMULATIVE_PCT } from "../data/cityLayout";

// GB statutory / operational frequency bands (real numbers).
export const NORMAL_LOW = 49.8;
export const NORMAL_HIGH = 50.2;
export const STATUTORY_LOW = 49.5;
export const STATUTORY_HIGH = 50.5;
export const STATUTORY_MAX_DWELL_S = 60;

// Overfrequency: sustained excursion above this triggers self-protective
// generator tripping (mirrors the underfrequency LFDD cascade).
export const OVERFREQ_TRIP_THRESHOLD = 50.5;
export const OVERFREQ_TRIP_DWELL_S = 3;

// Below this, treat the system as collapsed (needs a Black Start).
export const COLLAPSE_THRESHOLD_HZ = 47.5;

/**
 * 9 LFDD stages, evenly spaced 48.8 Hz -> 47.8 Hz. Each stage's
 * cumulativePct comes from the real city layout's shedding order, so the
 * "% of demand shed" number always matches what's actually dark in the
 * scene.
 */
export const LFDD_STAGES = Array.from({ length: 9 }, (_, i) => {
  const stage = i + 1;
  const thresholdHz = +(48.8 - i * 0.125).toFixed(3);
  const cumulativePct = LFDD_CUMULATIVE_PCT[i];
  return { stage, thresholdHz, cumulativePct };
});
