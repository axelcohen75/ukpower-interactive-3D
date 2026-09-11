import type { FuelType } from "../sim/types";

/** A short, bold, at-a-glance answer to "why does this exist in the market?" */
export const MARKET_ROLE: Record<FuelType, string> = {
  nuclear: "Always-on baseload — cheapest to run, first to be dispatched.",
  wind: "Free to run, but weather decides its output, not the market.",
  solar: "Free to run, but the sun decides its output, not the market.",
  hydro: "Cheap and fast-reacting — flexes ahead of gas when needed.",
  ccgt: "The system's workhorse — flexes to cover what renewables miss.",
  peaker: "Called on only at peak — usually sets the price everyone pays.",
  battery: "Not a market bidder — a fast reserve for balancing, not baseload.",
  interconnector: "Imported power — competes on price like any home generator.",
};

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
  interconnector:
    "Physically: one or more ±320-525kV DC cables laid on the seabed for hundreds of km, with a converter station at each end — a big industrial building doing AC→DC on the GB side and DC→AC on the other, the rectifier-and-inverter pair covered earlier. Most of the cost and loss sits in those stations (~0.6% each) rather than the cable itself (~3% per 1000km). Competes in the merit order at whatever price that power costs to import. Like wind and solar, it's power-electronics, not a spinning shaft, so it adds no natural inertia — a growing share of GB's supply now comes with none.",
};

export const FUEL_INERTIA_NOTE: Record<FuelType, string> = {
  nuclear: "Yes — large spinning turbine",
  wind: "No — connects via inverter",
  solar: "No — connects via inverter",
  hydro: "Yes — spinning turbine",
  ccgt: "Yes — spinning turbine",
  peaker: "Yes — spinning turbine (smaller)",
  battery: "No — connects via inverter",
  interconnector: "No — HVDC power-electronic link",
};
