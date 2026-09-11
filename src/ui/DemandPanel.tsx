import { useSimStore } from "../sim/store";
import { formatHour } from "../sim/demandCurve";
import { BASELOAD_MW } from "../sim/baseload";
import { SCENARIOS, SCENARIO_ORDER, type ScenarioId } from "../sim/scenarios";

const GB_PEAK_MW = 48000;
const DRAX_MW = 3900;
const SLIDER_MIN_MW = BASELOAD_MW;
const SLIDER_MAX_MW = 48000;

export function DemandPanel() {
  const mode = useSimStore((s) => s.demandMode);
  const manualDemandMW = useSimStore((s) => s.manualDemandMW);
  const demandMW = useSimStore((s) => s.demandMW);
  const hourOfDay = useSimStore((s) => s.hourOfDay);
  const activeScenarioId = useSimStore((s) => s.activeScenarioId);
  const setDemandMode = useSimStore((s) => s.setDemandMode);
  const setScenario = useSimStore((s) => s.setScenario);
  const setManualDemand = useSimStore((s) => s.setManualDemand);
  const setHourOfDay = useSimStore((s) => s.setHourOfDay);

  const scenario = SCENARIOS[activeScenarioId];

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
        <select
          className={mode === "scenario" ? "chip chip-active scenario-mode-select" : "chip scenario-mode-select"}
          value={mode === "scenario" ? activeScenarioId : ""}
          onChange={(e) => setScenario(e.target.value as ScenarioId)}
        >
          <option value="" disabled>
            Play a scenario…
          </option>
          {SCENARIO_ORDER.map((id) => (
            <option key={id} value={id}>
              {SCENARIOS[id].name}
            </option>
          ))}
        </select>
      </div>

      {mode === "scenario" && <div className="scenario-desc">{scenario.description}</div>}

      {mode === "manual" ? (
        <input
          type="range"
          min={SLIDER_MIN_MW}
          max={SLIDER_MAX_MW}
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
        {mode === "scenario" && <div className="demand-time">{formatHour(hourOfDay)}</div>}
      </div>
      <div className="scale-ref">
        ≈ {Math.round((demandMW / GB_PEAK_MW) * 100)}% of GB's record peak demand
        (~{GB_PEAK_MW.toLocaleString()} MW) · equivalent to about{" "}
        {Math.round(demandMW / DRAX_MW)} Drax power stations running flat out
        {mode === "manual" && (
          <>
            {" "}· capped at the {Math.round(BASELOAD_MW / 1000)}GW baseload floor — real GB
            demand never actually drops below it
          </>
        )}
      </div>
    </div>
  );
}
