import type { FuelType } from "../sim/types";

export const FUEL_BLURB: Record<FuelType, string> = {
  nuclear:
    "Runs flat-out almost all the time. Cheap to run once built, but physically can't ramp up or down quickly — that inflexibility is the trade-off for its rock-bottom cost.",
  wind:
    "Near-zero cost to run, but output follows the weather, not demand. Connects to the grid through an inverter, so it contributes no natural spinning inertia.",
  solar:
    "Free fuel, but only produces in daylight — zero at night, peak around midday. Like wind, it's inverter-connected, so it adds no natural inertia either.",
  hydro:
    "Cheap and genuinely flexible — its turbine can ramp output up in seconds, and because it's a real spinning mass, it contributes useful inertia.",
  ccgt:
    "Gas-fired, moderate cost, flexible enough to follow demand over minutes. Today it's one of the system's main sources of spinning inertia.",
  peaker:
    "Fast-starting but expensive open-cycle gas turbines, only called on right at the top of demand. Its high cost is usually what sets the clearing price at peak.",
  battery:
    "No fuel cost and near-instant response — the grid's fast defibrillator during a frequency dip. Energy-limited, so it's used for balancing seconds-to-minutes, not for sustained baseload.",
};

export const FUEL_INERTIA_NOTE: Record<FuelType, string> = {
  nuclear: "Yes — large spinning turbine",
  wind: "No — connects via inverter",
  solar: "No — connects via inverter",
  hydro: "Yes — spinning turbine",
  ccgt: "Yes — spinning turbine",
  peaker: "Yes — spinning turbine (smaller)",
  battery: "No — connects via inverter",
};
