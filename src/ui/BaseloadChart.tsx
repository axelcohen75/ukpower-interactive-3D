import { useMemo } from "react";
import { useSimStore } from "../sim/store";
import { FUEL_COLOR, FUEL_LABEL } from "../sim/dispatch";
import { computeDailyProfile, STACK_ORDER, BASELOAD_MW } from "../sim/baseload";

const W = 400;
const H = 150;
const PAD_L = 34;
const PAD_R = 6;
const PAD_T = 8;
const PAD_B = 18;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const MAX_MW = 48000;

function x(hour: number) {
  return PAD_L + (hour / 24) * PLOT_W;
}
function y(mw: number) {
  return PAD_T + PLOT_H - (Math.min(mw, MAX_MW) / MAX_MW) * PLOT_H;
}

export function BaseloadChart() {
  const demandMode = useSimStore((s) => s.demandMode);
  const hourOfDay = useSimStore((s) => s.hourOfDay);
  const points = useMemo(() => computeDailyProfile(0.5), []);

  const bands = useMemo(() => {
    return STACK_ORDER.map((fuel, i) => {
      const below = STACK_ORDER.slice(0, i);
      const top = points.map((p) => {
        const cum = below.reduce((sum, f) => sum + (p.byFuel[f] ?? 0), 0) + (p.byFuel[fuel] ?? 0);
        return [x(p.hour), y(cum)] as const;
      });
      const bottom = points
        .map((p) => {
          const cum = below.reduce((sum, f) => sum + (p.byFuel[f] ?? 0), 0);
          return [x(p.hour), y(cum)] as const;
        })
        .reverse();
      const d = [...top, ...bottom].map(([px, py], i2) => `${i2 === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ") + " Z";
      return { fuel, d };
    });
  }, [points]);

  const baseloadY = y(BASELOAD_MW);
  const markerX = demandMode === "scenario" ? x(hourOfDay) : null;

  return (
    <div className="panel">
      <div className="panel-title">
        Baseload vs peakload <span className="hint">— a typical 24h day</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {bands.map(({ fuel, d }) => (
          <path key={fuel} d={d} fill={FUEL_COLOR[fuel]} opacity={0.88} stroke="rgba(15,23,42,0.5)" strokeWidth={0.5} />
        ))}

        {/* baseload floor line */}
        <line x1={PAD_L} y1={baseloadY} x2={W - PAD_R} y2={baseloadY} stroke="#f8fafc" strokeWidth={1} strokeDasharray="3,3" opacity={0.75} />
        <text x={PAD_L + 2} y={baseloadY - 3} fontSize={8} fill="#f8fafc" opacity={0.85}>
          baseload floor ({Math.round(BASELOAD_MW / 1000)} GW)
        </text>

        {/* current-time marker, Play-a-day mode only */}
        {markerX !== null && (
          <line x1={markerX} y1={PAD_T} x2={markerX} y2={PAD_T + PLOT_H} stroke="#38bdf8" strokeWidth={1.5} />
        )}

        {/* x-axis hour ticks */}
        {[0, 6, 12, 18, 24].map((h) => (
          <text key={h} x={x(h)} y={H - 4} fontSize={8} fill="#64748b" textAnchor="middle">
            {h}h
          </text>
        ))}
        {/* y-axis 0 / max labels */}
        <text x={PAD_L - 4} y={PAD_T + PLOT_H} fontSize={8} fill="#64748b" textAnchor="end">
          0
        </text>
        <text x={PAD_L - 4} y={PAD_T + 8} fontSize={8} fill="#64748b" textAnchor="end">
          {MAX_MW / 1000}GW
        </text>
      </svg>

      <div className="baseload-legend">
        {STACK_ORDER.map((fuel) => (
          <span key={fuel} className="baseload-legend-item">
            <span className="dot" style={{ background: FUEL_COLOR[fuel] }} />
            {FUEL_LABEL[fuel]}
          </span>
        ))}
      </div>
      <div className="baseload-note">
        <strong>Baseload</strong> = the flat band GB demand never drops below — covered
        by nuclear and wind running near-flat out. <strong>Peakload</strong> = the
        variable part above it, switched on only when needed — mostly gas.
      </div>
    </div>
  );
}
