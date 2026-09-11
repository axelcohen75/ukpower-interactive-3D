import { Html } from "@react-three/drei";
import { useSimStore } from "../sim/store";

export function GSPNode({ position }: { position: [number, number, number] }) {
  const totalSupplyMW = useSimStore((s) => s.totalSupplyMW);

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#4a5568" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <torusGeometry args={[0.5, 0.12, 8, 16]} />
        <meshStandardMaterial color="#f6e05e" emissive="#f6e05e" emissiveIntensity={0.5} />
      </mesh>
      <Html position={[0, 3.6, 0]} center distanceFactor={22} occlude>
        <div
          style={{
            background: "rgba(17,24,39,0.85)",
            color: "white",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            border: "1px solid rgba(246,224,94,0.5)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600 }}>Grid Supply Point</div>
          <div style={{ opacity: 0.85 }}>
            <span style={{ color: "#f6ad55" }}>400 kV</span> transmission → step
            down →{" "}
            <span style={{ color: "#68d391" }}>33 kV</span> distribution
          </div>
          <div style={{ opacity: 0.7 }}>
            {Math.round(totalSupplyMW).toLocaleString()} MW flowing through
          </div>
        </div>
      </Html>
    </group>
  );
}
