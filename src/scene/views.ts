import type { ViewId } from "../ui/uiStore";

export interface ViewDef {
  label: string;
  shortLabel: string;
  position: [number, number, number];
  target: [number, number, number];
  color: string;
}

export const VIEWS: Record<ViewId, ViewDef> = {
  overview: {
    label: "Vue d'ensemble",
    shortLabel: "Vue d'ensemble",
    position: [-8, 42, 70],
    target: [-4, 5, 0],
    color: "#94a3b8",
  },
  generation: {
    label: "1. Génération",
    shortLabel: "Génération",
    position: [-26.5, 17, 19],
    target: [-26.5, 4, 0],
    color: "#f2c744",
  },
  transmission: {
    label: "2. Transport",
    shortLabel: "Transport",
    position: [-11, 13, 15],
    target: [-11, 4, 0],
    color: "#f6ad55",
  },
  distribution: {
    label: "3. Distribution",
    shortLabel: "Distribution",
    position: [10, 18, 20],
    target: [10, 4, 0],
    color: "#68d391",
  },
  consumption: {
    label: "4. Consommation",
    shortLabel: "Consommation",
    position: [19, 16, 18],
    target: [19, 4, 0],
    color: "#7dd3fc",
  },
};

export const VIEW_ORDER: ViewId[] = [
  "overview",
  "generation",
  "transmission",
  "distribution",
  "consumption",
];
