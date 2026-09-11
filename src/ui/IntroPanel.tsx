import { useState } from "react";

export function IntroPanel() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="intro-overlay">
      <div className="intro-card">
        <h1>How Great Britain keeps the lights on</h1>
        <p>
          Electricity flows through four stages: <strong>generation</strong>{" "}
          (power plants) → <strong>transmission</strong> (the national
          "motorway") → <strong>distribution</strong> (local "A-roads") →{" "}
          <strong>consumption</strong> (homes &amp; businesses).
        </p>
        <p>
          The catch: <strong>electricity can't be stored at grid scale.</strong>{" "}
          Supply must match demand at every instant, or the system destabilises.
          Watch the frequency gauge — it's the system's pulse, reacting live to
          every change you make.
        </p>
        <p className="intro-hint">
          Drag the demand slider, blow a cloud over the solar farm, or trip a
          gas plant — and watch the merit order and frequency respond.
        </p>
        <button className="scenario-btn" onClick={() => setVisible(false)}>
          Start exploring
        </button>
      </div>
    </div>
  );
}
