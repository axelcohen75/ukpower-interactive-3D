// The transmission -> distribution -> consumption hierarchy, laid out as
// real physical entities so the 3D scene, the LFDD blackout cascade and the
// UI can all read from one shared source of truth.
//
// 3 Grid Supply Points, each feeding a handful of town "blocks". Block
// `weight` is that block's share of *national* demand (all weights across
// all blocks sum to 100). Nine of the twelve blocks are "sheddable" — these
// are the blocks Low Frequency Demand Disconnection can switch off, in a
// fixed real-world-style shedding order. Three "protected" blocks (one per
// GSP — hospital / water treatment / rail depot, the kind of critical load
// LFDD schemes are designed to exempt) never go dark.

export type BlockKind = "residential" | "commercial" | "protected";

export interface GSPDef {
  id: string;
  name: string;
  position: [number, number, number];
}

export interface TownBlockDef {
  id: string;
  gspId: string;
  name: string;
  kind: BlockKind;
  /** Share of national demand, in percent (all blocks sum to 100). */
  weight: number;
  position: [number, number, number];
}

/** The transmission backbone junction where every generator's line converges
 * before splitting out (still thick, still 400kV) toward each GSP — the
 * "neck" of the funnel. */
export const TRUNK_POSITION: [number, number, number] = [-11, 2.5, 0];

// Kept shallow in Z (unlike a literal map) so each focused camera view can
// frame a whole tier without part of it projecting behind the 2D UI panels.
export const GSPS: GSPDef[] = [
  { id: "gsp-north", name: "GSP North", position: [9, 1, -4] },
  { id: "gsp-central", name: "GSP Central", position: [11, 1, 0] },
  { id: "gsp-south", name: "GSP South", position: [9, 1, 4] },
];

export const TOWN_BLOCKS: TownBlockDef[] = [
  // GSP South — LFDD stages 1-3 shed this GSP first
  { id: "south-res-1", gspId: "gsp-south", name: "Southfield Estate", kind: "residential", weight: 5, position: [16, 0, 6.5] },
  { id: "south-res-2", gspId: "gsp-south", name: "Riverside Homes", kind: "residential", weight: 7, position: [19.5, 0, 5] },
  { id: "south-com-1", gspId: "gsp-south", name: "Southgate Retail Park", kind: "commercial", weight: 7, position: [16, 0, 3.5] },
  { id: "south-protected", gspId: "gsp-south", name: "St Mary's Hospital", kind: "protected", weight: 13, position: [23, 0, 6] },

  // GSP Central — LFDD stages 4-6
  { id: "central-res-1", gspId: "gsp-central", name: "Elm Street", kind: "residential", weight: 7, position: [16.5, 0, 1.5] },
  { id: "central-com-1", gspId: "gsp-central", name: "High Street", kind: "commercial", weight: 7, position: [20, 0, 0] },
  { id: "central-res-2", gspId: "gsp-central", name: "Oakwood Close", kind: "residential", weight: 6, position: [16.5, 0, -1.5] },
  { id: "central-protected", gspId: "gsp-central", name: "Water Treatment Works", kind: "protected", weight: 13, position: [23, 0, 0] },

  // GSP North — LFDD stages 7-9
  { id: "north-res-1", gspId: "gsp-north", name: "Northgate Terrace", kind: "residential", weight: 7, position: [16, 0, -3.5] },
  { id: "north-com-1", gspId: "gsp-north", name: "Northgate Retail Park", kind: "commercial", weight: 7, position: [16, 0, -6.5] },
  { id: "north-res-2", gspId: "gsp-north", name: "Millfield Rise", kind: "residential", weight: 7, position: [19.5, 0, -5] },
  { id: "north-protected", gspId: "gsp-north", name: "Rail Depot", kind: "protected", weight: 14, position: [23, 0, -6] },
];

/**
 * The real-world-style Low Frequency Demand Disconnection shedding order:
 * stage index 0 sheds first (least severe), index 8 last (most severe).
 * Cumulative weight after each stage: 5, 12, 19, 26, 33, 39, 46, 53, 60 —
 * matching the real GB LFDD scheme's ~5% first stage and ~60% cumulative
 * across all 9 stages.
 */
export const LFDD_SHED_ORDER: string[] = [
  "south-res-1",
  "south-res-2",
  "south-com-1",
  "central-res-1",
  "central-com-1",
  "central-res-2",
  "north-res-1",
  "north-com-1",
  "north-res-2",
];

export const TOWN_BLOCK_BY_ID: Record<string, TownBlockDef> = Object.fromEntries(
  TOWN_BLOCKS.map((b) => [b.id, b]),
);

export const GSP_BY_ID: Record<string, GSPDef> = Object.fromEntries(
  GSPS.map((g) => [g.id, g]),
);

/** Cumulative % of national demand shed after each of the 9 LFDD stages. */
export const LFDD_CUMULATIVE_PCT: number[] = (() => {
  let running = 0;
  return LFDD_SHED_ORDER.map((id) => {
    running += TOWN_BLOCK_BY_ID[id].weight;
    return running;
  });
})();

/** Whether a given block is currently disconnected under N active LFDD stages. */
export function isBlockShed(blockId: string, activeLfddStages: number): boolean {
  const idx = LFDD_SHED_ORDER.indexOf(blockId);
  if (idx === -1) return false; // protected, or not a sheddable block
  return idx < activeLfddStages;
}
