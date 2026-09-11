import { Scene } from "./scene/Scene";
import { FrequencyGauge } from "./ui/FrequencyGauge";
import { DemandPanel } from "./ui/DemandPanel";
import { MeritOrderPanel } from "./ui/MeritOrderPanel";
import { ScenarioPanel } from "./ui/ScenarioPanel";
import { Glossary } from "./ui/Glossary";
import { IntroPanel } from "./ui/IntroPanel";
import { SystemStatusBanner } from "./ui/SystemStatusBanner";
import { ViewTabs } from "./ui/ViewTabs";
import { InspectorPanel } from "./ui/InspectorPanel";
import "./App.css";

function App() {
  return (
    <div className="app-root">
      <Scene />

      <header className="app-header">
        <div className="app-title">UK Power System</div>
        <div className="app-subtitle">
          Generation → Transmission → Distribution → Consumption
        </div>
      </header>

      <ViewTabs />

      <div className="overlay-right">
        <FrequencyGauge />
      </div>

      <div className="overlay-bottom">
        <DemandPanel />
        <MeritOrderPanel />
        <ScenarioPanel />
      </div>

      <InspectorPanel />
      <Glossary />
      <IntroPanel />
      <SystemStatusBanner />
    </div>
  );
}

export default App;
