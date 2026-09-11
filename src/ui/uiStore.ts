import { create } from "zustand";

export type SelectedEntity =
  | { type: "generator"; id: string }
  | { type: "gsp"; id: string }
  | null;

export type ViewId =
  | "overview"
  | "generation"
  | "transmission"
  | "distribution"
  | "consumption";

interface UiState {
  selected: SelectedEntity;
  setSelected: (e: SelectedEntity) => void;
  activeView: ViewId;
  setActiveView: (v: ViewId) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selected: null,
  setSelected: (e) => set({ selected: e }),
  activeView: "overview",
  setActiveView: (v) => set({ activeView: v }),
}));
