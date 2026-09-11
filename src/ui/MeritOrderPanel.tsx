import { GENERATORS, TOTAL_CAPACITY_MW } from "../sim/generators";
import { useSimStore } from "../sim/store";
import { FUEL_COLOR, FUEL_LABEL } from "../sim/dispatch";

const ORDERED = [...GENERATORS]
  .filter((g) => g.type !== "battery")
  .sort((a, b) => a.srmc - b.srmc);

export function MeritOrderPanel() {
  const generators = useSimStore((s) => s.generators);
  const demandMW = useSimStore((s) => s.demandMW);
  const effectiveDemandMW = useSimStore((s) => s.effectiveDemandMW);
  const activeLfddStages = useSimStore((s) => s.activeLfddStages);
  const clearingPrice = useSimStore((s) => s.clearingPriceGBPPerMWh);
  const marginalId = useSimStore((s) => s.marginalGeneratorId);

  const demandMarkerPct = Math.min(100, (effectiveDemandMW / TOTAL_CAPACITY_MW) * 100);
  const shedMW = demandMW - effectiveDemandMW;

  return (
    <div className="panel">
      <div className="panel-title">
        Merit order <span className="hint">— cheapest generator dispatched first</span>
      </div>
      <div className="merit-bar-wrap">
        <div className="merit-bar">
          {ORDERED.map((g) => {
            const widthPct = (g.capacityMW / TOTAL_CAPACITY_MW) * 100;
            const dispatchedFrac = Math.min(
              1,
              (generators[g.id]?.actualMW ?? 0) / g.capacityMW,
            );
            const isMarginal = marginalId === g.id;
            return (
              <div
                key={g.id}
                className={isMarginal ? "merit-seg merit-seg-marginal" : "merit-seg"}
                style={{ width: `${widthPct}%` }}
                title={`${FUEL_LABEL[g.type]} · £${g.srmc}/MWh · ${g.capacityMW.toLocaleString()} MW capacity`}
              >
                <div
                  className="merit-seg-fill"
                  style={{
                    width: `${dispatchedFrac * 100}%`,
                    background: FUEL_COLOR[g.type],
                  }}
                />
                <div className="merit-seg-bg" style={{ background: FUEL_COLOR[g.type] }} />
              </div>
            );
          })}
          <div className="demand-marker" style={{ left: `${demandMarkerPct}%` }}>
            <div className="demand-marker-label">demand{activeLfddStages > 0 ? " (after shedding)" : ""}</div>
          </div>
        </div>
      </div>

      {activeLfddStages > 0 && (
        <div className="lfdd-note">
          LFDD stage {activeLfddStages}/9 active — {Math.round(shedMW).toLocaleString()} MW of demand
          disconnected so generation doesn't have to cover it.
        </div>
      )}

      <div className="clearing-price">
        Clearing price:{" "}
        <strong>£{clearingPrice.toFixed(0)}/MWh</strong>
        {marginalId && (
          <span className="hint">
            {" "}
            — set by the marginal unit, {FUEL_LABEL[GENERATORS.find((g) => g.id === marginalId)!.type]}
          </span>
        )}
      </div>

      <table className="merit-table">
        <tbody>
          {ORDERED.map((g) => (
            <tr key={g.id} className={marginalId === g.id ? "marginal-row" : ""}>
              <td>
                <span className="dot" style={{ background: FUEL_COLOR[g.type] }} />
                {FUEL_LABEL[g.type]}
              </td>
              <td>£{g.srmc}/MWh</td>
              <td>
                {Math.round(generators[g.id]?.actualMW ?? 0).toLocaleString()} /{" "}
                {g.capacityMW.toLocaleString()} MW
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
