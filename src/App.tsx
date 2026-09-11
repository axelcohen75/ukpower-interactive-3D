import { Scene } from "./scene/Scene";
import { FrequencyGauge } from "./ui/FrequencyGauge";
import { DemandPanel } from "./ui/DemandPanel";
import { MeritOrderPanel } from "./ui/MeritOrderPanel";
import { PriceHistoryPanel } from "./ui/PriceHistoryPanel";
import { BaseloadChart } from "./ui/BaseloadChart";
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

      <ViewTabs />

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-title">UK Power System</div>
          <div className="app-subtitle">
            Generation → Transmission → Distribution → Consumption
          </div>
        </div>
        <DemandPanel />
        <MeritOrderPanel />
        <PriceHistoryPanel />
        <BaseloadChart />
        <ScenarioPanel />
      </aside>

      <div className="right-hud">
        <FrequencyGauge />
        <InspectorPanel />
      </div>
      <Glossary />
      <IntroPanel />
      <SystemStatusBanner />
    </div>
  );
}

export default App;
