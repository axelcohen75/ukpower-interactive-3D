import { useSimStore } from "../sim/store";

const MIN_HZ = 48.5;
const MAX_HZ = 51.5;
const SAFE_LOW = 49.5;
const SAFE_HIGH = 50.5;

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
  const imbalance = useSimStore((s) => s.totalSupplyMW - s.demandMW);

  const cx = 100;
  const cy = 100;
  const r = 78;
  const needleAngle = angleFor(freq);
  const outOfBand = freq < SAFE_LOW || freq > SAFE_HIGH;

  const supplyLead = imbalance > 200;
  const demandLead = imbalance < -200;

  return (
    <div className="panel gauge-panel">
      <div className="panel-title">
        Grid frequency <span className="hint">— the system's real-time health signal</span>
      </div>
      <svg width="200" height="140" viewBox="0 0 200 140">
        <path
          d={arcPath(cx, cy, r, -120, 120)}
          stroke="#1f2937"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, angleFor(SAFE_LOW), angleFor(SAFE_HIGH))}
          stroke="#22c55e"
          strokeWidth={14}
          fill="none"
        />
        <path
          d={arcPath(cx, cy, r, -120, angleFor(SAFE_LOW))}
          stroke="#f59e0b"
          strokeWidth={14}
          fill="none"
        />
        <path
          d={arcPath(cx, cy, r, angleFor(SAFE_HIGH), 120)}
          stroke="#f59e0b"
          strokeWidth={14}
          fill="none"
        />
        {(() => {
          const [nx, ny] = polarPoint(cx, cy, r - 6, needleAngle);
          return (
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke={outOfBand ? "#f87171" : "#e2e8f0"}
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          );
        })()}
        <circle cx={cx} cy={cy} r={6} fill="#e2e8f0" />
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize="22" fontWeight="700" fill={outOfBand ? "#f87171" : "#f8fafc"}>
          {freq.toFixed(2)} Hz
        </text>
      </svg>
      <div className="freq-status">
        {Math.abs(imbalance) < 200 && <span className="badge badge-ok">Supply ≈ demand</span>}
        {supplyLead && <span className="badge badge-warn">Supply &gt; demand — frequency rising</span>}
        {demandLead && <span className="badge badge-warn">Demand &gt; supply — frequency falling</span>}
      </div>
      <div className="freq-detail">
        Imbalance: {Math.round(imbalance).toLocaleString()} MW &nbsp;•&nbsp; ROCOF: {rocof.toFixed(3)} Hz/s
      </div>
      <div className="freq-explainer">
        Target 50.00 Hz, tolerated 49.5–50.5 Hz. Electricity can't be stored at
        grid scale, so this needle only holds still when generation matches
        demand <em>at this exact instant</em>.
      </div>
    </div>
  );
}
