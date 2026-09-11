import { useSimStore } from "../sim/store";

export function ScenarioPanel() {
  const windFactor = useSimStore((s) => s.windFactor);
  const setWindFactor = useSimStore((s) => s.setWindFactor);
  const cloud = useSimStore((s) => s.cloud);
  const triggerCloud = useSimStore((s) => s.triggerCloud);
  const generators = useSimStore((s) => s.generators);
  const tripGenerator = useSimStore((s) => s.tripGenerator);
  const restartGenerator = useSimStore((s) => s.restartGenerator);
  const reset = useSimStore((s) => s.reset);

  const ccgtTripped = generators["ccgt-a"]?.tripped;

  return (
    <div className="panel">
      <div className="panel-title">
        Try it <span className="hint">— cause and effect</span>
      </div>

      <label className="slider-row">
        <span>Wind {Math.round(windFactor * 100)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={windFactor}
          onChange={(e) => setWindFactor(Number(e.target.value))}
        />
      </label>

      <button className="scenario-btn" onClick={triggerCloud} disabled={cloud.active}>
        {cloud.active ? `☁️ Cloud passing… (${cloud.timeRemaining.toFixed(0)}s)` : "☁️ Send a cloud over the solar farm"}
      </button>

      {!ccgtTripped ? (
        <button className="scenario-btn scenario-btn-danger" onClick={() => tripGenerator("ccgt-a")}>
          ⚡ Trip the efficient gas CCGT unit
        </button>
      ) : (
        <button className="scenario-btn" onClick={() => restartGenerator("ccgt-a")}>
          🔧 Restart the gas CCGT unit
        </button>
      )}

      <button className="scenario-btn scenario-btn-ghost" onClick={reset}>
        ↺ Reset simulation
      </button>
    </div>
  );
}
