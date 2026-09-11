import { useState } from "react";
import { Html, useCursor } from "@react-three/drei";
import { useSimStore, isBlockShed } from "../sim/store";
import { useUiStore } from "../ui/uiStore";
import { TOWN_BLOCKS, type GSPDef } from "../data/cityLayout";

export function GSPNode({ def }: { def: GSPDef }) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const blocks = TOWN_BLOCKS.filter((b) => b.gspId === def.id);
  const totalWeight = blocks.reduce((sum, b) => sum + b.weight, 0);
  const activeLfddStages = useSimStore((s) => s.activeLfddStages);
  const shedWeight = blocks.reduce(
    (sum, b) => sum + (isBlockShed(b.id, activeLfddStages) ? b.weight : 0),
    0,
  );
  const dark = shedWeight >= totalWeight - 0.01;
  const selected = useUiStore((s) => s.selected?.type === "gsp" && s.selected.id === def.id);
  const setSelected = useUiStore((s) => s.setSelected);

  return (
    <group
      position={def.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(selected ? null : { type: "gsp", id: def.id });
      }}
    >
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.85, 32]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} transparent opacity={0.85} />
        </mesh>
      )}
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
      <Html position={[0, 3.3, 0]} center occlude style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: hover ? "rgba(17,24,39,0.95)" : "rgba(17,24,39,0.85)",
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
          <div style={{ fontWeight: 600 }}>{def.name} — substation</div>
          {hover && (
            <div style={{ fontWeight: 700, color: "#f6ad55", maxWidth: 190, whiteSpace: "normal", margin: "2px 0" }}>
              Physical link, not a market player — just moves whatever power is needed.
            </div>
          )}
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
