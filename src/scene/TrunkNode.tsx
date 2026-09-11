import { useState } from "react";
import { Html, useCursor } from "@react-three/drei";
import { useUiStore } from "../ui/uiStore";

/** The transmission backbone junction — every generator's 400kV line meets
 *  here before splitting out toward the Grid Supply Points. */
export function TrunkNode({ position }: { position: [number, number, number] }) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const activeView = useUiStore((s) => s.activeView);
  const showLabel = hover || activeView === "transmission";

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      <mesh>
        <cylinderGeometry args={[0.25, 0.4, 1, 8]} />
        <meshStandardMaterial color="#f6e05e" emissive="#f6e05e" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      {showLabel && (
        <Html position={[0, 1.7, 0]} center occlude style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: hover ? "rgba(17,24,39,0.95)" : "rgba(17,24,39,0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              border: "1px solid rgba(246,173,85,0.5)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 600 }}>Transmission hub</div>
            {hover && (
              <>
                <div style={{ opacity: 0.8 }}>every 400kV line meets here</div>
                <div style={{ opacity: 0.6, fontSize: 10, marginTop: 2 }}>wires owned by National Grid ET</div>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
