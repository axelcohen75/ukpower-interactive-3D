import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GENERATORS } from "../sim/generators";
import { useSimStore, isBlockShed } from "../sim/store";
import { FUEL_COLOR } from "../sim/dispatch";
import { GSPS, TOWN_BLOCKS, TRUNK_POSITION } from "../data/cityLayout";
import { GeneratorModel } from "./GeneratorModel";
import { PowerLine } from "./PowerLine";
import { Pylon } from "./Pylon";
import { GSPNode } from "./GSPNode";
import { gspFlowMW } from "./gspFlow";
import { TownBlockModel } from "./TownBlockModel";
import { Ground } from "./Ground";
import { Sun } from "./Sun";

function SimTicker() {
  useFrame((_, delta) => {
    useSimStore.getState().tick(delta);
  });
  return null;
}

const TRANSMISSION_MAX_MW = 20000;

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [-8, 42, 70], fov: 46 }}
      style={{ background: "linear-gradient(#0b1120,#0b1120)" }}
    >
      <color attach="background" args={["#0b1120"]} />
      <fog attach="fog" args={["#0b1120", 55, 110]} />
      <hemisphereLight args={["#334155", "#0b1120", 0.35]} />
      <Sun />

      <SimTicker />
      <Ground />

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

      <Pylon position={[-26, 0, -9]} />
      <Pylon position={[-26, 0, 9]} />
      <Pylon position={[-17, 0, 0]} />
      <mesh position={TRUNK_POSITION}>
        <cylinderGeometry args={[0.25, 0.4, 1, 8]} />
        <meshStandardMaterial color="#f6e05e" emissive="#f6e05e" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

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

      <Pylon position={[-2, 0, -8]} />
      <Pylon position={[-2, 0, 8]} />
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
        target={[-4, 5, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={14}
        maxDistance={110}
      />
    </Canvas>
  );
}
