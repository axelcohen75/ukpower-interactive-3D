import { useState } from "react";
import { useSimStore } from "../sim/store";
import { SCENARIOS } from "../sim/scenarios";

type ScenarioChoice = "" | "cloud" | "trip-ccgt" | "restart-ccgt" | "demand-drop" | "aug2019";

export function ScenarioPanel() {
  const [choice, setChoice] = useState<ScenarioChoice>("");
  const demandMode = useSimStore((s) => s.demandMode);
  const activeScenarioId = useSimStore((s) => s.activeScenarioId);
  const windFactor = useSimStore((s) => s.windFactor);
  const setWindFactor = useSimStore((s) => s.setWindFactor);
  const cloud = useSimStore((s) => s.cloud);
  const triggerCloud = useSimStore((s) => s.triggerCloud);
  const triggerDemandDrop = useSimStore((s) => s.triggerDemandDrop);
  const triggerAug2019 = useSimStore((s) => s.triggerAug2019);
  const generators = useSimStore((s) => s.generators);
  const tripGenerator = useSimStore((s) => s.tripGenerator);
  const restartGenerator = useSimStore((s) => s.restartGenerator);
  const reset = useSimStore((s) => s.reset);
  const systemState = useSimStore((s) => s.systemState);

  const ccgtTripped = generators["ccgt-a"]?.tripped;
  const disabled = systemState !== "normal";

  function handleChoice(value: ScenarioChoice) {
    setChoice("");
    if (value === "cloud") triggerCloud();
    else if (value === "trip-ccgt") tripGenerator("ccgt-a");
    else if (value === "restart-ccgt") restartGenerator("ccgt-a");
    else if (value === "demand-drop") triggerDemandDrop();
    else if (value === "aug2019") triggerAug2019();
  }

  return (
    <div className="panel">
      <div className="panel-title">
        Try it <span className="hint">— cause and effect</span>
      </div>

      {demandMode === "manual" ? (
        <label className="slider-row">
          <span>Wind {Math.round(windFactor * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={windFactor}
            onChange={(e) => setWindFactor(Number(e.target.value))}
            disabled={disabled}
          />
        </label>
      ) : (
        <div className="slider-row hint" style={{ fontStyle: "italic" }}>
          Wind is set by the "{SCENARIOS[activeScenarioId].name}" scenario, not this slider.
        </div>
      )}

      <select
        className="scenario-select"
        value={choice}
        disabled={disabled}
        onChange={(e) => handleChoice(e.target.value as ScenarioChoice)}
      >
        <option value="" disabled>
          Trigger a scenario…
        </option>
        <option value="cloud" disabled={cloud.active}>
          ☁️ {cloud.active ? `Cloud passing… (${cloud.timeRemaining.toFixed(0)}s)` : "Send a cloud over the solar farm"}
        </option>
        {!ccgtTripped ? (
          <option value="trip-ccgt">⚡ Trip the efficient gas CCGT unit</option>
        ) : (
          <option value="restart-ccgt">🔧 Restart the gas CCGT unit</option>
        )}
        <option value="demand-drop">📉 Trip a major industrial load (overfrequency test)</option>
        <option value="aug2019">🇬🇧 Replay 9 Aug 2019 blackout</option>
      </select>

      <button className="scenario-btn scenario-btn-ghost" onClick={reset}>
        ↺ Reset simulation
      </button>
    </div>
  );
}
