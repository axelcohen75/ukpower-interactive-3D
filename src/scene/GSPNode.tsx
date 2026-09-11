import { Html } from "@react-three/drei";
import { useSimStore, isBlockShed } from "../sim/store";
import { TOWN_BLOCKS, type GSPDef } from "../data/cityLayout";

export function GSPNode({ def }: { def: GSPDef }) {
  const blocks = TOWN_BLOCKS.filter((b) => b.gspId === def.id);
  const totalWeight = blocks.reduce((sum, b) => sum + b.weight, 0);
  const activeLfddStages = useSimStore((s) => s.activeLfddStages);
  const shedWeight = blocks.reduce(
    (sum, b) => sum + (isBlockShed(b.id, activeLfddStages) ? b.weight : 0),
    0,
  );
  const dark = shedWeight >= totalWeight - 0.01;

  return (
    <group position={def.position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.8, 2, 1.8]} />
        <meshStandardMaterial color={dark ? "#1f2937" : "#4a5568"} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <torusGeometry args={[0.45, 0.1, 8, 16]} />
        <meshStandardMaterial
          color={dark ? "#374151" : "#f6e05e"}
          emissive={dark ? "#000000" : "#f6e05e"}
          emissiveIntensity={dark ? 0 : 0.5}
        />
      </mesh>
      <Html position={[0, 3.3, 0]} center distanceFactor={24} occlude>
        <div
          style={{
            background: "rgba(17,24,39,0.85)",
            color: "white",
            padding: "5px 9px",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            border: dark ? "1px solid #ef4444" : "1px solid rgba(246,224,94,0.5)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600 }}>{def.name}</div>
          <div style={{ opacity: 0.85 }}>
            <span style={{ color: "#f6ad55" }}>400 kV</span> →{" "}
            <span style={{ color: dark ? "#ef4444" : "#68d391" }}>33 kV</span>
          </div>
          {shedWeight > 0 && (
            <div style={{ color: "#f87171" }}>
              {dark ? "fully disconnected" : `${shedWeight.toFixed(0)}% shed`}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
