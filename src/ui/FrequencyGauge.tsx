import { useSimStore } from "../sim/store";
import {
  LFDD_STAGES,
  NORMAL_HIGH,
  NORMAL_LOW,
  OVERFREQ_TRIP_THRESHOLD,
  STATUTORY_HIGH,
  STATUTORY_LOW,
} from "../sim/frequencyBands";

const MIN_HZ = 47.0;
const MAX_HZ = 51.5;

function angleFor(hz: number) {
  const clamped = Math.min(MAX_HZ, Math.max(MIN_HZ, hz));
  const t = (clamped - MIN_HZ) / (MAX_HZ - MIN_HZ);
  return -120 + t * 240; // degrees, -120..120
}

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polarPoint(cx, cy, r, a0);
  const [x1, y1] = polarPoint(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function FrequencyGauge() {
  const freq = useSimStore((s) => s.frequencyHz);
  const rocof = useSimStore((s) => s.rocofHzPerS);
  const imbalance = useSimStore((s) => s.totalSupplyMW - s.effectiveDemandMW);
  const systemState = useSimStore((s) => s.systemState);
  const activeLfddStages = useSimStore((s) => s.activeLfddStages);
  const overFreqTrip = useSimStore((s) => s.overFreqTrip);

  const cx = 100;
  const cy = 100;
  const r = 78;
  const needleAngle = angleFor(freq);
  const inStatutory = freq < STATUTORY_LOW || freq > STATUTORY_HIGH;
  const inNormal = freq >= NORMAL_LOW && freq <= NORMAL_HIGH;

  const supplyLead = imbalance > 200;
  const demandLead = imbalance < -200;

  let needleColor = "#e2e8f0";
  if (systemState !== "normal" || activeLfddStages > 0 || overFreqTrip.active) needleColor = "#f87171";
  else if (inStatutory) needleColor = "#fbbf24";

  return (
    <div className="panel gauge-panel">
      <div className="panel-title">
        Grid frequency <span className="hint">— the system's real-time health signal</span>
      </div>
      <svg width="200" height="140" viewBox="0 0 200 140">
        <path d={arcPath(cx, cy, r, -120, 120)} stroke="#1f2937" strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, angleFor(NORMAL_LOW), angleFor(NORMAL_HIGH))} stroke="#22c55e" strokeWidth={14} fill="none" />
        <path d={arcPath(cx, cy, r, angleFor(STATUTORY_LOW), angleFor(NORMAL_LOW))} stroke="#f59e0b" strokeWidth={14} fill="none" />
        <path d={arcPath(cx, cy, r, angleFor(NORMAL_HIGH), angleFor(STATUTORY_HIGH))} stroke="#f59e0b" strokeWidth={14} fill="none" />
        <path d={arcPath(cx, cy, r, -120, angleFor(STATUTORY_LOW))} stroke="#ef4444" strokeWidth={14} fill="none" />
        <path d={arcPath(cx, cy, r, angleFor(STATUTORY_HIGH), 120)} stroke="#ef4444" strokeWidth={14} fill="none" />
        {/* LFDD stage tick marks */}
        {LFDD_STAGES.map((st) => {
          const [x1, y1] = polarPoint(cx, cy, r - 7, angleFor(st.thresholdHz));
          const [x2, y2] = polarPoint(cx, cy, r + 7, angleFor(st.thresholdHz));
          return <line key={st.stage} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0b1120" strokeWidth={1.5} />;
        })}
        {(() => {
          const [nx, ny] = polarPoint(cx, cy, r - 6, needleAngle);
          return <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={needleColor} strokeWidth={3.5} strokeLinecap="round" />;
        })()}
        <circle cx={cx} cy={cy} r={6} fill="#e2e8f0" />
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize="22" fontWeight="700" fill={needleColor}>
          {systemState === "collapsed" ? "-- Hz" : `${freq.toFixed(2)} Hz`}
        </text>
      </svg>

      <div className="freq-status">
        {systemState === "collapsed" && <span className="badge badge-critical">SYSTEM COLLAPSE</span>}
        {systemState === "blackstart" && <span className="badge badge-warn">BLACK START IN PROGRESS</span>}
        {systemState === "normal" && activeLfddStages > 0 && (
          <span className="badge badge-critical">LFDD stage {activeLfddStages}/9 active</span>
        )}
        {systemState === "normal" && overFreqTrip.active && (
          <span className="badge badge-critical">Generators self-tripping (overfrequency)</span>
        )}
        {systemState === "normal" && activeLfddStages === 0 && !overFreqTrip.active && inNormal && (
          <span className="badge badge-ok">Normal band</span>
        )}
        {systemState === "normal" && activeLfddStages === 0 && !overFreqTrip.active && !inNormal && (
          <span className="badge badge-warn">
            {supplyLead ? "Supply > demand — rising" : demandLead ? "Demand > supply — falling" : "Outside normal band"}
          </span>
        )}
      </div>
      <div className="freq-detail">
        Imbalance: {Math.round(imbalance).toLocaleString()} MW &nbsp;•&nbsp; RoCoF: {rocof.toFixed(3)} Hz/s
      </div>
      <div className="freq-explainer">
        {systemState === "collapsed" ? (
          <>The system has collapsed. Nothing is generating or consuming power — a manual <strong>Black Start</strong> is required.</>
        ) : (
          <>
            Normal 49.8–50.2 Hz, statutory 49.5–50.5 Hz (max 60s). Below 48.8 Hz,
            substations automatically shed demand in stages (LFDD). Above{" "}
            {OVERFREQ_TRIP_THRESHOLD} Hz sustained, generators self-protect by
            tripping offline.
          </>
        )}
      </div>
    </div>
  );
}
