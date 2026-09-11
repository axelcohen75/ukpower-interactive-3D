import { useSimStore } from "../sim/store";
import { formatHour } from "../sim/demandCurve";
import { BASELOAD_MW } from "../sim/baseload";

const GB_PEAK_MW = 48000;
const DRAX_MW = 3900;
const SLIDER_MIN_MW = 18000;
const SLIDER_MAX_MW = 48000;
const BASELOAD_PCT = ((BASELOAD_MW - SLIDER_MIN_MW) / (SLIDER_MAX_MW - SLIDER_MIN_MW)) * 100;

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
        <div className="slider-with-marker">
          <input
            type="range"
            min={SLIDER_MIN_MW}
            max={SLIDER_MAX_MW}
            step={250}
            value={manualDemandMW}
            onChange={(e) => setManualDemand(Number(e.target.value))}
          />
          <div className="baseload-tick" style={{ left: `${BASELOAD_PCT}%` }} title={`Baseload floor: ${BASELOAD_MW.toLocaleString()} MW`} />
        </div>
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
        {mode === "manual" && (
          <>
            {" "}· the ▲ mark is the baseload floor ({BASELOAD_MW.toLocaleString()} MW)
            — demand never drops below it in real life
          </>
        )}
      </div>
    </div>
  );
}
