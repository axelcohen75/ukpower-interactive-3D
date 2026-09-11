import { Html } from "@react-three/drei";
import { useSimStore, isBlockShed } from "../sim/store";
import { daylightFactor } from "../sim/demandCurve";
import type { TownBlockDef } from "../data/cityLayout";

function HouseCluster({ dark }: { dark: boolean }) {
  const winColor = dark ? "#1e293b" : "#fbbf24";
  const houses: [number, number, number][] = [
    [-0.9, 0, -0.6],
    [0.7, 0, -0.3],
    [-0.4, 0, 0.8],
    [1, 0, 0.9],
  ];
  return (
    <group>
      {houses.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.9, 1, 0.9]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 1.15, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.72, 0.5, 4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.5, 0.46]}>
            <boxGeometry args={[0.3, 0.3, 0.02]} />
            <meshStandardMaterial
              color={winColor}
              emissive={winColor}
              emissiveIntensity={dark ? 0 : 0.9}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CommercialBlock({ dark }: { dark: boolean }) {
  const winColor = dark ? "#1e293b" : "#7dd3fc";
  return (
    <group>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2.6, 2.2, 1.8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {[-0.9, -0.3, 0.3, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.91]}>
          <boxGeometry args={[0.35, 1.6, 0.02]} />
          <meshStandardMaterial
            color={winColor}
            emissive={winColor}
            emissiveIntensity={dark ? 0 : 0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ProtectedBlock() {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[2.2, 1.8, 1.6]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[1.3, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.08]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[1.3, 1.5, 0.05]}>
        <boxGeometry args={[0.18, 0.5, 0.1]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

function StreetLight({ on }: { on: boolean }) {
  return (
    <group position={[1.6, 0, -1.6]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial
          color="#fde68a"
          emissive="#fde68a"
          emissiveIntensity={on ? 1.4 : 0}
          toneMapped={false}
        />
      </mesh>
      {on && <pointLight position={[0, 1.8, 0]} color="#fde68a" intensity={2} distance={4} />}
    </group>
  );
}

export function TownBlockModel({ def }: { def: TownBlockDef }) {
  const activeLfddStages = useSimStore((s) => s.activeLfddStages);
  const hourOfDay = useSimStore((s) => s.hourOfDay);
  const demandMode = useSimStore((s) => s.demandMode);
  const dark = isBlockShed(def.id, activeLfddStages);
  const night = demandMode === "dayCycle" ? daylightFactor(hourOfDay) < 0.15 : false;

  return (
    <group position={def.position}>
      {def.kind === "residential" && <HouseCluster dark={dark} />}
      {def.kind === "commercial" && <CommercialBlock dark={dark} />}
      {def.kind === "protected" && <ProtectedBlock />}
      {def.kind !== "protected" && <StreetLight on={night && !dark} />}

      {/* Only label a block when there's something worth drawing the eye to
          — a blackout, or a protected site — to keep the normal view clean. */}
      {(dark || def.kind === "protected") && (
        <Html position={[0, 2.6, 0]} center occlude style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(17,24,39,0.8)",
              color: dark ? "#f87171" : "white",
              padding: "3px 7px",
              borderRadius: 5,
              fontSize: 10,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              border: def.kind === "protected" ? "1px solid #ef4444" : "1px solid rgba(248,113,113,0.5)",
              pointerEvents: "none",
            }}
          >
            {def.name}
            {def.kind === "protected" ? " (protected)" : " — dark"}
          </div>
        </Html>
      )}
    </group>
  );
}
