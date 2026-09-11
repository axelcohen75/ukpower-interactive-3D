import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GENERATORS } from "../sim/generators";
import { useSimStore } from "../sim/store";
import { FUEL_COLOR } from "../sim/dispatch";
import { GeneratorModel } from "./GeneratorModel";
import { PowerLine } from "./PowerLine";
import { Pylon } from "./Pylon";
import { GSPNode } from "./GSPNode";
import { Town } from "./Town";
import { Ground } from "./Ground";

const GSP_POSITION: [number, number, number] = [0, 0, 0];
const TOWN_POSITION: [number, number, number] = [9, 0, 0];

function SimTicker() {
  useFrame((_, delta) => {
    useSimStore.getState().tick(delta);
  });
  return null;
}

const DISTRIBUTION_TARGETS: [number, number, number][] = [
  [6.5, 0, -3],
  [6.5, 0, 3],
  [7.5, 0, 0],
];

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [-2, 24, 42], fov: 45 }}
      style={{ background: "linear-gradient(#0b1120,#0b1120)" }}
    >
      <color attach="background" args={["#0b1120"]} />
      <fog attach="fog" args={["#0b1120", 40, 85]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[15, 25, 10]} intensity={1.1} castShadow />
      <hemisphereLight args={["#334155", "#0b1120", 0.4]} />

      <SimTicker />
      <Ground />

      {GENERATORS.map((g) => (
        <GeneratorModel key={g.id} def={g} />
      ))}

      {GENERATORS.map((g) => (
        <PowerLine
          key={`line-${g.id}`}
          from={[g.position[0], 1, g.position[2]]}
          to={[GSP_POSITION[0], 1.6, GSP_POSITION[2]]}
          color={FUEL_COLOR[g.type]}
          maxMW={g.capacityMW}
          particleCount={g.type === "battery" ? 6 : 10}
          getFlowMW={() => useSimStore.getState().generators[g.id]?.actualMW ?? 0}
        />
      ))}

      <Pylon position={[-4, 0, -6]} />
      <Pylon position={[-4, 0, 6]} />
      <Pylon position={[4, 0, 0]} />

      <GSPNode position={GSP_POSITION} />

      {DISTRIBUTION_TARGETS.map((target, i) => (
        <PowerLine
          key={`dist-${i}`}
          from={[GSP_POSITION[0], 1.6, GSP_POSITION[2]]}
          to={target}
          color="#68d391"
          maxMW={16000}
          particleCount={8}
          getFlowMW={() => useSimStore.getState().totalSupplyMW / DISTRIBUTION_TARGETS.length}
        />
      ))}

      <Town position={TOWN_POSITION} />

      <OrbitControls
        target={[-3, 2, 0]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={10}
        maxDistance={65}
      />
    </Canvas>
  );
}
