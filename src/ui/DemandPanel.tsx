import { useSimStore } from "../sim/store";
import { formatHour } from "../sim/demandCurve";

const GB_PEAK_MW = 48000;
const DRAX_MW = 3900;

export function DemandPanel() {
  const mode = useSimStore((s) => s.demandMode);
  const manualDemandMW = useSimStore((s) => s.manualDemandMW);
  const demandMW = useSimStore((s) => s.demandMW);
  const hourOfDay = useSimStore((s) => s.hourOfDay);
  const setDemandMode = useSimStore((s) => s.setDemandMode);
  const setManualDemand = useSimStore((s) => s.setManualDemand);
  const setHourOfDay = useSimStore((s) => s.setHourOfDay);

  return (
    <div className="panel">
      <div className="panel-title">
        National demand <span className="hint">— how much GB is using right now</span>
      </div>

      <div className="mode-toggle">
        <button
          className={mode === "manual" ? "chip chip-active" : "chip"}
          onClick={() => setDemandMode("manual")}
        >
          Manual slider
        </button>
        <button
          className={mode === "dayCycle" ? "chip chip-active" : "chip"}
          onClick={() => setDemandMode("dayCycle")}
        >
          Play a day
        </button>
      </div>

      {mode === "manual" ? (
        <input
          type="range"
          min={18000}
          max={48000}
          step={250}
          value={manualDemandMW}
          onChange={(e) => setManualDemand(Number(e.target.value))}
        />
      ) : (
        <input
          type="range"
          min={0}
          max={24}
          step={0.05}
          value={hourOfDay}
          onChange={(e) => setHourOfDay(Number(e.target.value))}
        />
      )}

      <div className="demand-readout">
        <div className="demand-value">{Math.round(demandMW).toLocaleString()} MW</div>
        {mode === "dayCycle" && <div className="demand-time">{formatHour(hourOfDay)}</div>}
      </div>
      <div className="scale-ref">
        ≈ {Math.round((demandMW / GB_PEAK_MW) * 100)}% of GB's record peak demand
        (~{GB_PEAK_MW.toLocaleString()} MW) · equivalent to about{" "}
        {Math.round(demandMW / DRAX_MW)} Drax power stations running flat out
      </div>
    </div>
  );
}
