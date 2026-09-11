import { useUiStore } from "./uiStore";
import { useSimStore, isBlockShed } from "../sim/store";
import { GENERATORS } from "../sim/generators";
import { FUEL_COLOR, FUEL_LABEL } from "../sim/dispatch";
import { FUEL_BLURB, FUEL_INERTIA_NOTE } from "./fuelBlurbs";
import { GSPS, TOWN_BLOCKS } from "../data/cityLayout";

function rampDescription(rampRateMWps: number, capacityMW: number): string {
  if (!Number.isFinite(rampRateMWps)) return "Tracks its target instantly.";
  const secondsForFullRange = capacityMW / rampRateMWps;
  if (secondsForFullRange < 10) return `Very fast — full range in ~${Math.round(secondsForFullRange)}s.`;
  if (secondsForFullRange < 120) return `Fairly fast — full range in ~${Math.round(secondsForFullRange)}s.`;
  return `Slow — would take ~${Math.round(secondsForFullRange / 60)} min to swing its full range.`;
}

function GeneratorInspector({ id }: { id: string }) {
  const def = GENERATORS.find((g) => g.id === id);
  const state = useSimStore((s) => s.generators[id]);
  if (!def || !state) return null;
  const color = FUEL_COLOR[def.type];
  const loadFrac = Math.min(1, state.actualMW / def.capacityMW);

  return (
    <>
      <div className="inspector-header">
        <span className="dot" style={{ background: color, width: 12, height: 12 }} />
        <div>
          <div className="inspector-title">{def.name}</div>
          <div className="hint">{FUEL_LABEL[def.type]}</div>
        </div>
      </div>

      {state.tripped ? (
        <div className="badge badge-critical" style={{ marginBottom: 8 }}>
          TRIPPED — offline
        </div>
      ) : (
        <div className="inspector-bar-row">
          <div className="inspector-bar-track">
            <div className="inspector-bar-fill" style={{ width: `${loadFrac * 100}%`, background: color }} />
          </div>
          <div className="inspector-bar-label">
            {Math.round(state.actualMW).toLocaleString()} / {def.capacityMW.toLocaleString()} MW
          </div>
        </div>
      )}

      <table className="inspector-table">
        <tbody>
          <tr>
            <td>Cost to run (SRMC)</td>
            <td>£{def.srmc}/MWh</td>
          </tr>
          <tr>
            <td>Contributes inertia</td>
            <td>{FUEL_INERTIA_NOTE[def.type]}</td>
          </tr>
          <tr>
            <td>Ramp speed</td>
            <td>{rampDescription(def.rampRateMWps, def.capacityMW)}</td>
          </tr>
        </tbody>
      </table>

      <p className="inspector-blurb">{FUEL_BLURB[def.type]}</p>
    </>
  );
}

function GSPInspector({ id }: { id: string }) {
  const gsp = GSPS.find((g) => g.id === id);
  const activeLfddStages = useSimStore((s) => s.activeLfddStages);
  const demandMW = useSimStore((s) => s.demandMW);
  if (!gsp) return null;
  const blocks = TOWN_BLOCKS.filter((b) => b.gspId === id);

  return (
    <>
      <div className="inspector-header">
        <span className="dot" style={{ background: "#f6ad55", width: 12, height: 12 }} />
        <div>
          <div className="inspector-title">{gsp.name}</div>
          <div className="hint">Grid Supply Point</div>
        </div>
      </div>

      <p className="inspector-blurb">
        The physical junction where the 400kV transmission network hands off
        to the 33kV local distribution network — a step-down transformer
        substation, not a decision-maker. It just moves whatever power the
        blocks below it need.
      </p>

      <div className="inspector-subtitle">Blocks served</div>
      <table className="inspector-table">
        <tbody>
          {blocks.map((b) => {
            const dark = isBlockShed(b.id, activeLfddStages);
            const mw = (b.weight / 100) * demandMW;
            return (
              <tr key={b.id} className={dark ? "marginal-row" : ""}>
                <td style={{ color: dark ? "#f87171" : undefined }}>
                  {b.name}
                  {b.kind === "protected" ? " 🛡" : ""}
                </td>
                <td style={{ color: dark ? "#f87171" : undefined }}>
                  {dark ? "dark" : `${Math.round(mw).toLocaleString()} MW`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export function InspectorPanel() {
  const selected = useUiStore((s) => s.selected);
  const setSelected = useUiStore((s) => s.setSelected);

  if (!selected) return null;

  return (
    <div className="panel inspector-panel">
      <button className="inspector-close" onClick={() => setSelected(null)}>
        ✕
      </button>
      {selected.type === "generator" && <GeneratorInspector id={selected.id} />}
      {selected.type === "gsp" && <GSPInspector id={selected.id} />}
    </div>
  );
}
