export type FuelType =
  | "nuclear"
  | "wind"
  | "solar"
  | "hydro"
  | "ccgt"
  | "peaker"
  | "battery";

export interface GeneratorDef {
  id: string;
  name: string;
  type: FuelType;
  /** Nameplate capacity in MW */
  capacityMW: number;
  /** Short-run marginal cost, £/MWh */
  srmc: number;
  /** Relative contribution to system inertia (0 = inverter-connected, no natural inertia) */
  inertiaFactor: number;
  /** Max MW/s the output can change when ramping toward a new target (Infinity = instant) */
  rampRateMWps: number;
  /** Position in the 3D scene, in scene units */
  position: [number, number, number];
}

export interface GeneratorState {
  id: string;
  /** What merit-order dispatch is currently asking this unit to produce, MW */
  targetMW: number;
  /** What it is actually producing right now, MW (ramps toward targetMW) */
  actualMW: number;
  /** Available capacity right now (post weather / trip derating), MW */
  availableMW: number;
  /** True once actualMW > 0 */
  online: boolean;
  tripped: boolean;
}

export type DemandMode = "manual" | "dayCycle";

export interface ScenarioCloud {
  active: boolean;
  /** seconds remaining in the cloud event */
  timeRemaining: number;
}
