import type { ViewId } from "../ui/uiStore";

export interface ViewDef {
  label: string;
  shortLabel: string;
  position: [number, number, number];
  target: [number, number, number];
  color: string;
}

// Every view's target/position.x is shifted a few world units further from
// the content than a dead-center framing would use — the left ~360px of
// the viewport is a permanent sidebar now, so "centered" would actually
// push content behind it. Shifting the look-at point left of center pushes
// the (unmoved) scene content rightward on screen, into the open area.
export const VIEWS: Record<ViewId, ViewDef> = {
  overview: {
    label: "Vue d'ensemble",
    shortLabel: "Vue d'ensemble",
    position: [-12, 42, 70],
    target: [-8, 5, 0],
    color: "#94a3b8",
  },
  generation: {
    label: "1. Génération",
    shortLabel: "Génération",
    position: [-30.5, 17, 19],
    target: [-30.5, 4, 0],
    color: "#f2c744",
  },
  transmission: {
    label: "2. Transport",
    shortLabel: "Transport",
    position: [-13, 15, 18],
    target: [-10, 4, 0],
    color: "#f6ad55",
  },
  distribution: {
    label: "3. Distribution",
    shortLabel: "Distribution",
    position: [6, 18, 20],
    target: [6, 4, 0],
    color: "#68d391",
  },
  consumption: {
    label: "4. Consommation",
    shortLabel: "Consommation",
    position: [15, 16, 18],
    target: [15, 4, 0],
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
