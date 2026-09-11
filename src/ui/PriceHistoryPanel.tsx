import { useSimStore } from "../sim/store";

const W = 400;
const H = 60;
const PAD = 4;

/** A static snapshot for manual mode — dragging the slider produces
 *  disconnected demand values with no real elapsed time between them, so a
 *  trend line here would visually imply a smooth evolution that never
 *  actually happened. */
function StaticPriceReadout() {
  const clearingPrice = useSimStore((s) => s.clearingPriceGBPPerMWh);
  const marginalId = useSimStore((s) => s.marginalGeneratorId);

  return (
    <div className="panel">
      <div className="panel-title">
        Clearing price <span className="hint">— at this demand level</span>
      </div>
      <div className="price-static-value">£{clearingPrice.toFixed(0)}/MWh</div>
      <div className="hint" style={{ fontSize: 11 }}>
        {marginalId ? "Recalculates instantly as you move the slider." : "Collecting data…"}
      </div>
    </div>
  );
}

function PriceHistoryChart() {
  const priceHistory = useSimStore((s) => s.priceHistory);
  const clearingPrice = useSimStore((s) => s.clearingPriceGBPPerMWh);

  if (priceHistory.length < 2) {
    return (
      <div className="panel">
        <div className="panel-title">
          Clearing price <span className="hint">— this scenario's timeline</span>
        </div>
        <div className="hint">Collecting data…</div>
      </div>
    );
  }

  const maxP = Math.max(...priceHistory, 1);
  const minP = Math.min(...priceHistory, 0);
  const range = Math.max(maxP - minP, 1);

  const points = priceHistory.map((p, i) => {
    const px = PAD + (i / (priceHistory.length - 1)) * (W - PAD * 2);
    const py = H - PAD - ((p - minP) / range) * (H - PAD * 2);
    return [px, py] as const;
  });
  const linePath = points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${H - PAD} L${points[0][0].toFixed(1)},${H - PAD} Z`;

  return (
    <div className="panel">
      <div className="panel-title">
        Clearing price <span className="hint">— this scenario's timeline</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <path d={areaPath} fill="rgba(56,189,248,0.15)" />
        <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth={1.5} />
      </svg>
      <div className="price-history-readout">
        <span>min £{minP.toFixed(0)}</span>
        <span>
          now <strong style={{ color: "#e2e8f0" }}>£{clearingPrice.toFixed(0)}/MWh</strong>
        </span>
        <span>max £{maxP.toFixed(0)}</span>
      </div>
    </div>
  );
}

export function PriceHistoryPanel() {
  const demandMode = useSimStore((s) => s.demandMode);
  return demandMode === "scenario" ? <PriceHistoryChart /> : <StaticPriceReadout />;
}
