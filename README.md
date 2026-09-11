# UK Power System — 3D Educational Simulator

An interactive 3D visualization teaching absolute beginners how the Great
Britain electricity system physically works: generation → transmission →
distribution → consumption, and why supply must equal demand at every
instant.

## Stack

React + TypeScript + Vite, 3D rendered with
[react-three-fiber](https://github.com/pmndrs/react-three-fiber) /
[three.js](https://threejs.org/), state managed with
[zustand](https://github.com/pmndrs/zustand). All 3D assets are procedural
(no external model files).

## Running locally

```bash
npm install
npm run dev
```

## What it teaches

- **The four stages** of the GB grid, laid out left to right in the 3D
  scene: generation (nuclear, wind, solar, hydro, gas CCGT, gas peakers,
  battery storage) → transmission pylons → a Grid Supply Point (where
  voltage steps down from 400 kV to 33 kV) → distribution → a demand town.
- **Frequency as the grid's real-time health signal** — a live gauge in
  the top right that reacts instantly to any supply/demand imbalance,
  driven by a simplified inertia + restoring-force physics model
  (`src/sim/store.ts`).
- **The merit order** — generators are dispatched cheapest short-run
  marginal cost first; the panel at the bottom shows the dispatch stack,
  the demand cut-off, and the resulting clearing price.
- **Cause and effect scenarios** — send a cloud over the solar farm, trip
  a gas CCGT unit (watch battery storage respond within seconds while
  other plants ramp up), or play through a stylised 24-hour demand curve.
- A glossary panel (bottom-right `?` button) covers AC/DC, transformers,
  voltage/current/power, watts vs watt-hours, and the GB voltage cascade
  from turbine to wall socket.

## Project structure

```
src/
  sim/     simulation engine: generator fleet data, merit-order dispatch,
           demand curve, frequency physics (zustand store)
  scene/   procedural 3D scene: generators, pylons, animated power-flow
           lines, the Grid Supply Point, and the demand town
  ui/      2D overlay: frequency gauge, demand controls, merit-order
           panel, scenario buttons, glossary
```
