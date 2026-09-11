// Stylised GB national demand shape over a 24h day, in MW.
// Key points roughly follow the real shape: overnight trough, morning ramp,
// a shallow midday dip (increasingly seen as solar grows), and a sharp
// evening peak once people get home and put the kettle / oven / heating on.
const KEY_POINTS: [hour: number, demandMW: number][] = [
  [0, 26000],
  [3, 21000],
  [5, 21500],
  [7, 33000],
  [9, 36500],
  [11, 33500],
  [13, 30500],
  [15, 32000],
  [17, 39000],
  [18, 45000],
  [19, 44000],
  [21, 39000],
  [23, 30000],
  [24, 26000],
];

/** The floor of the 24h demand curve — GB demand never dips below this,
 *  even at 3am. This is the standard definition of "baseload": the part of
 *  demand that's always there, as opposed to "peakload", the variable part
 *  above it that only shows up at certain hours. */
export const DEMAND_FLOOR_MW = Math.min(...KEY_POINTS.map(([, mw]) => mw));

function cosineInterp(a: number, b: number, t: number): number {
  const mu = (1 - Math.cos(t * Math.PI)) / 2;
  return a * (1 - mu) + b * mu;
}

/** Builds a smooth 24h(hour) -> MW function from a set of key points, using
 *  the same cosine interpolation as the default GB curve — shared so other
 *  scenarios (cold snap, heatwave, ...) can define their own demand shape. */
export function makeDailyCurve(keyPoints: [hour: number, mw: number][]): (hour: number) => number {
  return (hour: number) => {
    const h = ((hour % 24) + 24) % 24;
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const [h0, d0] = keyPoints[i];
      const [h1, d1] = keyPoints[i + 1];
      if (h >= h0 && h <= h1) {
        const t = (h - h0) / (h1 - h0);
        return cosineInterp(d0, d1, t);
      }
    }
    return keyPoints[0][1];
  };
}

/** National demand (MW) at a given hour-of-day (0..24, wraps). */
export const demandAtHour = makeDailyCurve(KEY_POINTS);

/** Daylight factor 0..1 used to scale solar availability by time of day. */
export function daylightFactor(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  // Sun roughly up 6:00-20:00, peaking at 13:00.
  const sunrise = 6;
  const sunset = 20;
  if (h < sunrise || h > sunset) return 0;
  const t = (h - sunrise) / (sunset - sunrise); // 0..1
  return Math.sin(t * Math.PI); // 0 at edges, 1 at midday-ish
}

export function formatHour(hour: number): string {
  const h = Math.floor(((hour % 24) + 24) % 24);
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
