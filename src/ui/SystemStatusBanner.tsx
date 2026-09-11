import { BLACK_START_STEPS, useSimStore } from "../sim/store";

export function SystemStatusBanner() {
  const systemState = useSimStore((s) => s.systemState);
  const blackStart = useSimStore((s) => s.blackStart);
  const beginBlackStart = useSimStore((s) => s.beginBlackStart);

  if (systemState === "normal") return null;

  return (
    <div className="collapse-overlay">
      <div className="collapse-card">
        {systemState === "collapsed" ? (
          <>
            <h2>System collapse</h2>
            <p>
              Frequency fell too far, too fast for the defences to arrest it —
              all nine LFDD stages shed and the system still couldn't recover.
              Every generator has tripped offline and the whole town is dark.
            </p>
            <p className="intro-hint">
              Recovery from here isn't automatic: operators bring the grid
              back from zero, starting with self-starting plant (batteries,
              hydro), using it to energise a local island, then bootstrapping
              larger plant from there.
            </p>
            <button className="scenario-btn scenario-btn-danger" onClick={beginBlackStart}>
              ⚡ Begin Black Start
            </button>
          </>
        ) : (
          <>
            <h2>Black Start in progress</h2>
            <ol className="blackstart-steps">
              {BLACK_START_STEPS.map((step, i) => {
                const state =
                  !blackStart || i < blackStart.stepIndex
                    ? "done"
                    : i === blackStart.stepIndex
                      ? "active"
                      : "pending";
                return (
                  <li key={step.label} className={`bs-step bs-step-${state}`}>
                    {step.label}
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
