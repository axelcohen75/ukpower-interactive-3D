import { Grid } from "@react-three/drei";

export function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[80, 40]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1f2937"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#334155"
        fadeDistance={60}
        infiniteGrid={false}
      />
    </group>
  );
}
