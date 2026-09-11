import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useSimStore } from "../sim/store";

const BUILDINGS: { pos: [number, number, number]; size: [number, number, number] }[] = [
  { pos: [0, 0, -3], size: [1.2, 2.2, 1.2] },
  { pos: [1.6, 0, -2], size: [1, 1.6, 1] },
  { pos: [-1.6, 0, -2.4], size: [1.4, 3, 1.4] },
  { pos: [0.8, 0, 0], size: [1.1, 1.2, 1.1] },
  { pos: [-1, 0, 0.4], size: [1.3, 2, 1.3] },
  { pos: [2, 0, 0.6], size: [1, 1.8, 1] },
  { pos: [-2.2, 0, 1.8], size: [1.2, 1.3, 1.2] },
  { pos: [1, 0, 2.2], size: [1.4, 2.4, 1.4] },
];

export function Town({ position }: { position: [number, number, number] }) {
  const winRef = useRef<THREE.Material[]>([]);
  const demandMW = useSimStore((s) => s.demandMW);

  useFrame(({ clock }) => {
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3);
    for (const m of winRef.current) {
      if (m && "emissiveIntensity" in m) {
        (m as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + pulse * 0.4;
      }
    }
  });

  return (
    <group position={position}>
      {BUILDINGS.map((b, i) => (
        <mesh key={i} position={[b.pos[0], b.size[1] / 2, b.pos[2]]}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color="#2d3748"
            emissive="#f6ad55"
            emissiveIntensity={0.7}
            ref={(m) => {
              if (m) winRef.current[i] = m;
            }}
          />
        </mesh>
      ))}
      <Html position={[0, 4.4, -0.5]} center distanceFactor={22} occlude>
        <div
          style={{
            background: "rgba(17,24,39,0.8)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            border: "1px solid rgba(255,255,255,0.15)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600 }}>Great Britain — demand</div>
          <div style={{ opacity: 0.85 }}>
            {Math.round(demandMW).toLocaleString()} MW
          </div>
        </div>
      </Html>
    </group>
  );
}
