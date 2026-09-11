import { useSimStore, isBlockShed } from "../sim/store";
import { TOWN_BLOCKS } from "../data/cityLayout";

/** Live MW flowing into a GSP right now (imperative, no React re-render). */
export function gspFlowMW(gspId: string): number {
  const s = useSimStore.getState();
  const blocks = TOWN_BLOCKS.filter((b) => b.gspId === gspId);
  const poweredWeight = blocks.reduce(
    (sum, b) => sum + (isBlockShed(b.id, s.activeLfddStages) ? 0 : b.weight),
    0,
  );
  return (poweredWeight / 100) * s.demandMW;
}
