import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import type { GeneratorDef } from "../sim/types";
import { useSimStore } from "../sim/store";
import { useUiStore } from "../ui/uiStore";
import { FUEL_COLOR, FUEL_LABEL } from "../sim/dispatch";

function NuclearVisual({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[1.1, 1.5, 2.8, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function WindVisual({ color, spinRef }: { color: string; spinRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 3.6, 8]} />
        <meshStandardMaterial color="#f7fafc" />
      </mesh>
      <group ref={spinRef} position={[0, 3.6, 0]}>
        {[0, 120, 240].map((deg) => (
          <mesh key={deg} rotation={[0, 0, THREE.MathUtils.degToRad(deg)]} position={[0, 0.9, 0]}>
            <boxGeometry args={[0.15, 1.8, 0.05]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SolarVisual({ color }: { color: string }) {
  const cells = [];
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      cells.push([x, z] as const);
    }
  }
  return (
    <group rotation={[-0.4, 0, 0]} position={[0, 0.8, 0]}>
      {cells.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x * 0.9, 0, z * 0.9]}>
          <boxGeometry args={[0.8, 0.06, 0.8]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function HydroVisual({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.4, 1.6, 1.6]} />
        <meshStandardMaterial color="#a0aec0" />
      </mesh>
      <mesh position={[0, 0.3, 1.1]}>
        <boxGeometry args={[2.6, 0.15, 0.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function GasVisual({ color, stacks = 1 }: { color: string; stacks?: number }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.2, 1.4, 1.6]} />
        <meshStandardMaterial color="#cbd5e0" />
      </mesh>
      {Array.from({ length: stacks }).map((_, i) => (
        <mesh key={i} position={[-0.6 + i * 1.2, 1.9, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 1.6, 10]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function BatteryVisual({ color }: { color: string }) {
  return (
    <group>
      {[-0.7, 0, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.5, 1, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function GeneratorModel({ def }: { def: GeneratorDef }) {
  const spinRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const color = FUEL_COLOR[def.type];
  const selected = useUiStore(
    (s) => s.selected?.type === "generator" && s.selected.id === def.id,
  );
  const setSelected = useUiStore((s) => s.setSelected);

  useFrame((_, delta) => {
    if (spinRef.current) {
      const g = useSimStore.getState().generators[def.id];
      const frac = g ? g.actualMW / def.capacityMW : 0;
      spinRef.current.rotation.z += delta * (0.5 + frac * 6);
    }
  });

  const actualMW = useSimStore((s) => s.generators[def.id]?.actualMW ?? 0);
  const tripped = useSimStore((s) => s.generators[def.id]?.tripped ?? false);
  const loadFrac = Math.min(1, actualMW / def.capacityMW);

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
        setSelected(selected ? null : { type: "generator", id: def.id });
      }}
    >
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.9, 2.15, 32]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} transparent opacity={0.85} />
        </mesh>
      )}
      {def.type === "nuclear" && <NuclearVisual color={color} />}
      {def.type === "wind" && <WindVisual color={color} spinRef={spinRef} />}
      {def.type === "solar" && <SolarVisual color={color} />}
      {def.type === "hydro" && <HydroVisual color={color} />}
      {def.type === "ccgt" && <GasVisual color={color} stacks={2} />}
      {def.type === "peaker" && <GasVisual color={color} stacks={1} />}
      {def.type === "battery" && <BatteryVisual color={color} />}

      {/* load bar */}
      <mesh position={[0, -0.15, 1.3]}>
        <boxGeometry args={[2.2, 0.12, 0.12]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      <mesh position={[-1.1 + loadFrac * 1.1, -0.15, 1.32]}>
        <boxGeometry args={[Math.max(0.02, loadFrac * 2.2), 0.13, 0.13]} />
        <meshStandardMaterial
          color={tripped ? "#e53e3e" : color}
          emissive={tripped ? "#e53e3e" : color}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>

      <Html position={[0, 4.4, 0]} center occlude style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: hover ? "rgba(17,24,39,0.95)" : "rgba(17,24,39,0.75)",
            color: "white",
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            border: tripped ? "1px solid #e53e3e" : "1px solid rgba(255,255,255,0.15)",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600 }}>{FUEL_LABEL[def.type]}</div>
          <div style={{ opacity: 0.85 }}>
            {tripped ? "TRIPPED — offline" : `${Math.round(actualMW).toLocaleString()} MW / ${def.capacityMW.toLocaleString()} MW`}
          </div>
        </div>
      </Html>
    </group>
  );
}
