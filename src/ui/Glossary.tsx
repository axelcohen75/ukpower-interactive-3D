import { useState } from "react";

const VOLTAGE_CASCADE: [string, string][] = [
  ["Generator output", "tens of kV"],
  ["Transmission (National Grid)", "400 kV / 275 kV"],
  ["Grid Supply Point", "steps down to 132 kV or 33 kV"],
  ["Distribution cascade", "33 kV → 11 kV → 400 V"],
  ["Consumer socket", "~230 V"],
];

const GLOSSARY: [string, string][] = [
  ["Watt (W) vs watt-hour (Wh)", "A watt is a rate — how fast energy flows right now, like a car's speed. A watt-hour is a quantity — power sustained over time, like the distance travelled."],
  ["Voltage / current / power", "Voltage is electrical \"pressure\", current is the flow rate of charge, and power (watts) = voltage × current — like a water pipe's pressure, flow rate, and rate of work."],
  ["AC vs DC", "DC flows one direction (batteries, solar panels). AC reverses direction repeatedly — the GB grid alternates 50 times a second (50 Hz). The grid uses AC because transformers, which need a changing current, only work on AC."],
  ["Transformer / rectifier / inverter", "A transformer changes voltage (AC only). A rectifier converts AC→DC (e.g. EV charging). An inverter converts DC→AC (e.g. connecting solar or batteries to the grid)."],
  ["Why high voltage for transmission", "Power = voltage × current, but cable losses scale with current². Doubling voltage halves current for the same power, cutting losses to a quarter — so transmission runs at hundreds of kV."],
  ["Frequency", "The grid's real-time health signal. GB targets 50 Hz. Supply > demand → frequency rises. Demand > supply → frequency falls."],
  ["Inertia", "Large spinning turbines (gas, nuclear) naturally resist sudden frequency change because of their rotating mass. Wind/solar connect via inverters, so they don't provide this natural buffer."],
  ["NESO", "National Energy System Operator — balances supply and demand in real time nationally, like air traffic control for electricity. It's the decision-maker behind the merit order, but owns no physical wires at all."],
  ["National Grid ET", "National Grid Electricity Transmission — owns and maintains the actual 400kV/275kV transmission wires and pylons (the trunk and the lines to each GSP in this scene). Distinct from NESO: NESO decides who generates and when, National Grid ET owns the cables that carry it."],
  ["DNO", "Distribution Network Operator — one of 14 regional operators owning the physical distribution network in their area."],
  ["Grid Supply Point (GSP)", "A physical junction, with a step-down transformer, where transmission hands off to distribution."],
  ["Merit order", "Generators ranked cheapest to most expensive (by short-run marginal cost). NESO calls on the cheapest first until supply meets demand."],
  ["SRMC", "Short-run marginal cost — the cost of producing one more unit from an already-running generator (fuel + carbon cost, not the cost of building the plant)."],
];

export function Glossary() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="glossary-fab" onClick={() => setOpen((o) => !o)} title="Glossary & physics basics">
        {open ? "✕" : "?"}
      </button>
      {open && (
        <div className="glossary-panel">
          <div className="panel-title">Voltage cascade — turbine to socket</div>
          <table className="voltage-table">
            <tbody>
              {VOLTAGE_CASCADE.map(([stage, v]) => (
                <tr key={stage}>
                  <td>{stage}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="glossary-note">
            Power passes through ~4 transformers between turbine and wall
            socket. GB's total transmission + distribution losses run around
            5–6% of electricity generated.
          </div>

          <div className="panel-title" style={{ marginTop: 14 }}>
            Glossary
          </div>
          {GLOSSARY.map(([term, def]) => (
            <div key={term} className="glossary-entry">
              <div className="glossary-term">{term}</div>
              <div className="glossary-def">{def}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
