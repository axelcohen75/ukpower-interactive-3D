import { useUiStore } from "./uiStore";
import { VIEWS, VIEW_ORDER } from "../scene/views";

export function ViewTabs() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const setSelected = useUiStore((s) => s.setSelected);

  return (
    <div className="view-tabs">
      {VIEW_ORDER.map((id) => {
        const v = VIEWS[id];
        const active = activeView === id;
        return (
          <button
            key={id}
            className={active ? "view-tab view-tab-active" : "view-tab"}
            style={active ? { borderColor: v.color, color: v.color } : undefined}
            onClick={() => {
              setActiveView(id);
              setSelected(null);
            }}
          >
            {v.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
