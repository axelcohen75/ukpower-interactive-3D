export function Pylon({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[0.9, 6, 4]} />
        <meshStandardMaterial color="#718096" metalness={0.5} roughness={0.5} wireframe />
      </mesh>
      <mesh position={[0, 6.2, 0]}>
        <boxGeometry args={[2.2, 0.15, 0.15]} />
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
