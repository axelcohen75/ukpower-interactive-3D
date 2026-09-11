import { Grid } from "@react-three/drei";

export function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 60]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <Grid
        position={[-3, 0, 0]}
        args={[100, 60]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1f2937"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#334155"
        fadeDistance={140}
        infiniteGrid={false}
      />
    </group>
  );
}
