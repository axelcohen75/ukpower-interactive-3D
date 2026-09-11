import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GENERATORS } from "../sim/generators";
import { useSimStore, isBlockShed } from "../sim/store";
import { FUEL_COLOR } from "../sim/dispatch";
import { GSPS, TOWN_BLOCKS, TRUNK_POSITION } from "../data/cityLayout";
import { useUiStore } from "../ui/uiStore";
import { VIEWS } from "./views";
import { GeneratorModel } from "./GeneratorModel";
import { PowerLine } from "./PowerLine";
import { Pylon } from "./Pylon";
import { GSPNode } from "./GSPNode";
import { gspFlowMW } from "./gspFlow";
import { TownBlockModel } from "./TownBlockModel";
import { Ground } from "./Ground";
import { Sun } from "./Sun";
import { CameraRig } from "./CameraRig";
import { ZoneHighlights } from "./ZoneHighlights";
import { TrunkNode } from "./TrunkNode";

function SimTicker() {
  useFrame((_, delta) => {
    useSimStore.getState().tick(delta);
  });
  return null;
}

const TRANSMISSION_MAX_MW = 20000;

export function Scene() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <Canvas
      shadows
      camera={{ position: VIEWS.overview.position, fov: 46 }}
      style={{ background: "linear-gradient(#0b1120,#0b1120)" }}
      onPointerMissed={() => useUiStore.getState().setSelected(null)}
    >
      <color attach="background" args={["#0b1120"]} />
      <fog attach="fog" args={["#0b1120", 55, 110]} />
      <hemisphereLight args={["#334155", "#0b1120", 0.35]} />
      <Sun />

      <SimTicker />
      <CameraRig controlsRef={controlsRef} />
      <Ground />
      <ZoneHighlights />

      {/* Tier 1: generation */}
      {GENERATORS.map((g) => (
        <GeneratorModel key={g.id} def={g} />
      ))}

      {/* Tier 2: transmission — generators converge on the trunk junction */}
      {GENERATORS.map((g) => (
        <PowerLine
          key={`line-${g.id}`}
          from={[g.position[0], 1, g.position[2]]}
          to={[TRUNK_POSITION[0], TRUNK_POSITION[1], TRUNK_POSITION[2]]}
          color={FUEL_COLOR[g.type]}
          maxMW={g.capacityMW}
          tier="transmission"
          getFlowMW={() => useSimStore.getState().generators[g.id]?.actualMW ?? 0}
        />
      ))}

      <Pylon position={[-26, 0, -6]} />
      <Pylon position={[-26, 0, 6]} />
      <Pylon position={[-15, 0, 0]} />
      <TrunkNode position={TRUNK_POSITION} />

      {/* Trunk -> each Grid Supply Point, still transmission-tier (400kV) */}
      {GSPS.map((gsp) => (
        <PowerLine
          key={`trunk-${gsp.id}`}
          from={TRUNK_POSITION}
          to={[gsp.position[0], gsp.position[1] + 0.6, gsp.position[2]]}
          color="#f6ad55"
          maxMW={TRANSMISSION_MAX_MW}
          tier="transmission"
          getFlowMW={() => gspFlowMW(gsp.id)}
        />
      ))}

      <Pylon position={[-2, 0, -3]} />
      <Pylon position={[-2, 0, 3]} />
      <Pylon position={[3, 0, 0]} />

      {/* Tier 3: Grid Supply Points — the visible step-down */}
      {GSPS.map((gsp) => (
        <GSPNode key={gsp.id} def={gsp} />
      ))}

      {/* Tier 4: distribution — thin lines fanning out to each town block */}
      {TOWN_BLOCKS.map((block) => {
        const gsp = GSPS.find((g) => g.id === block.gspId)!;
        return (
          <PowerLine
            key={`dist-${block.id}`}
            from={[gsp.position[0], gsp.position[1] + 0.6, gsp.position[2]]}
            to={block.position}
            color="#68d391"
            maxMW={(block.weight / 100) * 50000}
            tier="distribution"
            getFlowMW={() => {
              const s = useSimStore.getState();
              const shed = isBlockShed(block.id, s.activeLfddStages);
              return shed ? 0 : (block.weight / 100) * s.demandMW;
            }}
          />
        );
      })}

      {/* Tier 5: consumption — the town */}
      {TOWN_BLOCKS.map((block) => (
        <TownBlockModel key={block.id} def={block} />
      ))}

      <OrbitControls
        ref={controlsRef}
        target={VIEWS.overview.target}
        enableRotate={false}
        enablePan={false}
        enableZoom={true}
        minDistance={10}
        maxDistance={95}
      />
    </Canvas>
  );
}
