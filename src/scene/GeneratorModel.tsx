import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import type { GeneratorDef } from "../sim/types";
import { useSimStore } from "../sim/store";
import { useUiStore } from "../ui/uiStore";
import { FUEL_COLOR } from "../sim/dispatch";
import { MARKET_ROLE } from "../ui/fuelBlurbs";

function NuclearVisual({ color }: { color: string }) {
  return (
    <group>
      {/* cooling tower — hyperboloid silhouette via two stacked tapered cylinders */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[1.25, 1.55, 1.8, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[1.1, 1.25, 1, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      {/* horizontal texture rings */}
      {[0.5, 1.3, 2.1].map((h) => (
        <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1 + (1.5 - h * 0.15) * 0.05, 0.03, 6, 24]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* adjacent reactor building */}
      <mesh position={[1.9, 0.55, 0.3]}>
        <boxGeometry args={[1.1, 1.1, 1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[1.9, 1.2, 0.3]}>
        <sphereGeometry args={[0.58, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
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
      {/* nacelle housing behind the hub */}
      <mesh position={[-0.28, 3.6, 0]}>
        <boxGeometry args={[0.55, 0.24, 0.24]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <group ref={spinRef} position={[0, 3.6, 0]}>
        <mesh>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        {/* Each blade is a child of its own rotated pivot group, so it
            extends radially outward from the hub instead of just being
            rotated in place. */}
        {[0, 120, 240].map((deg) => (
          <group key={deg} rotation={[0, 0, THREE.MathUtils.degToRad(deg)]}>
            <mesh position={[0, 0.95, 0]}>
              <boxGeometry args={[0.14, 1.7, 0.04]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
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
    <group>
      <group rotation={[-0.4, 0, 0]} position={[0, 0.8, 0]}>
        {cells.map(([x, z]) => (
          <group key={`${x}-${z}`} position={[x * 0.9, 0, z * 0.9]}>
            {/* dark frame behind the cell, slightly larger */}
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[0.86, 0.04, 0.86]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.76, 0.05, 0.76]} />
              <meshStandardMaterial color={color} metalness={0.4} roughness={0.25} />
            </mesh>
            {/* cell grid lines */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.02, 0.01, 0.76]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          </group>
        ))}
      </group>
      {/* support struts to the ground */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.35, 0.7]} rotation={[-0.4, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
    </group>
  );
}

function HydroVisual({ color }: { color: string }) {
  return (
    <group>
      {/* dam wall */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.4, 1.6, 1.6]} />
        <meshStandardMaterial color="#a0aec0" />
      </mesh>
      {/* sluice gate stripes */}
      {[-0.8, 0, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.8, 0.81]}>
          <boxGeometry args={[0.35, 1.5, 0.03]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      ))}
      {/* spillway / water outflow */}
      <mesh position={[0, 0.3, 1.1]}>
        <boxGeometry args={[2.6, 0.15, 0.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {/* generator house on top */}
      <mesh position={[0, 1.85, -0.2]}>
        <boxGeometry args={[1.3, 0.5, 0.9]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.16, -0.2]}>
        <boxGeometry args={[1.4, 0.12, 1]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}

let sharedSmokeTexture: THREE.CanvasTexture | null = null;
function getSmokeTexture(): THREE.CanvasTexture {
  if (sharedSmokeTexture) return sharedSmokeTexture;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  sharedSmokeTexture = new THREE.CanvasTexture(canvas);
  return sharedSmokeTexture;
}

/** Rising, fading exhaust puffs above a stack — visible only once the plant
 *  is actually producing, so an idle peaker reads as visibly "off" and a
 *  dispatched one reads as visibly "started up", not just a number change. */
function StackExhaust({ loadFrac, offsetX }: { loadFrac: number; offsetX: number }) {
  const texture = getSmokeTexture();
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const PUFF_COUNT = 3;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < PUFF_COUNT; i++) {
      const sprite = refs.current[i];
      if (!sprite) continue;
      const phase = (t * (0.35 + loadFrac * 0.5) + i / PUFF_COUNT) % 1;
      sprite.position.set(offsetX, 2.85 + phase * 1.7, 0);
      sprite.scale.setScalar(0.22 + phase * 0.5);
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.opacity = loadFrac > 0.03 ? (1 - phase) * Math.min(1, loadFrac * 1.5) * 0.55 : 0;
    }
  });

  return (
    <group>
      {Array.from({ length: PUFF_COUNT }).map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[offsetX, 2.85, 0]}
        >
          <spriteMaterial map={texture} transparent depthWrite={false} opacity={0} color="#cbd5e1" />
        </sprite>
      ))}
    </group>
  );
}

function GasVisual({ color, stacks = 1, loadFrac = 0 }: { color: string; stacks?: number; loadFrac?: number }) {
  const running = loadFrac > 0.03;
  const stackColor = running ? color : "#4b5563";
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.2, 1.4, 1.6]} />
        <meshStandardMaterial color="#cbd5e0" />
      </mesh>
      {/* pipework connecting the stacks */}
      {stacks > 1 && (
        <mesh position={[0, 1.15, 0.55]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 1.2 * (stacks - 1), 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
        </mesh>
      )}
      {/* small fuel tank beside the building */}
      <mesh position={[1.5, 0.45, 0.6]}>
        <cylinderGeometry args={[0.32, 0.32, 0.9, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.3} roughness={0.5} />
      </mesh>
      {Array.from({ length: stacks }).map((_, i) => {
        const offsetX = -0.6 + i * 1.2;
        return (
          <group key={i}>
            <mesh position={[offsetX, 1.9, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 1.6, 10]} />
              <meshStandardMaterial
                color={stackColor}
                emissive={running ? color : "#000000"}
                emissiveIntensity={running ? 0.35 + loadFrac * 0.4 : 0}
              />
            </mesh>
            {/* stack cap */}
            <mesh position={[offsetX, 2.72, 0]}>
              <cylinderGeometry args={[0.2, 0.18, 0.08, 10]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <StackExhaust loadFrac={loadFrac} offsetX={offsetX} />
          </group>
        );
      })}
    </group>
  );
}

// Flag emoji don't render reliably on every OS/font (they fall back to
// showing the raw two-letter code in a box), so use a small styled chip
// instead — guaranteed to render the same everywhere.
const COUNTRY_CHIP: Record<string, { code: string; color: string }> = {
  France: { code: "FR", color: "#0055a4" },
  Norway: { code: "NO", color: "#00205b" },
  Denmark: { code: "DK", color: "#c8102e" },
  Netherlands: { code: "NL", color: "#21468b" },
  Belgium: { code: "BE", color: "#fdda24" },
  Ireland: { code: "IE", color: "#169b62" },
};

/** One converter station — a real GB interconnector's onshore end always
 *  has one of these, converting AC<->DC. Each aggregated node renders one
 *  per real link it stands in for, so the count itself teaches "this is
 *  several cables bundled together". */
function ConverterStation({ color, offsetX }: { color: string; offsetX: number }) {
  return (
    <group position={[offsetX, 0, 0]}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.1, 1.4, 1.1]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[-0.28, 1.5, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.28, 1.5, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      {/* subsea cable stub diving away, toward the coast */}
      <mesh position={[0, 0.2, 0.9]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function InterconnectorVisual({ color, linkCount }: { color: string; linkCount: number }) {
  const spacing = 1.5;
  const start = -((linkCount - 1) * spacing) / 2;
  return (
    <group>
      {Array.from({ length: linkCount }).map((_, i) => (
        <ConverterStation key={i} color={color} offsetX={start + i * spacing} />
      ))}
    </group>
  );
}

function BatteryVisual({ color }: { color: string }) {
  return (
    <group>
      {[-0.7, 0, 0.7].map((x) => (
        <group key={x} position={[x, 0.5, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 1, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
          {/* cooling vents */}
          {[-0.25, 0, 0.25].map((v) => (
            <mesh key={v} position={[0, v, 0.51]}>
              <boxGeometry args={[0.38, 0.06, 0.02]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ))}
        </group>
      ))}
      {/* control cabinet */}
      <mesh position={[0, 0.35, -0.65]}>
        <boxGeometry args={[2.2, 0.7, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
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
  const activeView = useUiStore((s) => s.activeView);
  // Persist the label only in the view where this installation is the
  // focus — otherwise its label can float over the sidebar or other
  // tiers' content when it's just in the background of an unrelated view.
  const relevantView = def.type === "interconnector" ? "transmission" : "generation";
  const showLabel = hover || activeView === relevantView;

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
      {def.type === "ccgt" && <GasVisual color={color} stacks={2} loadFrac={loadFrac} />}
      {def.type === "peaker" && <GasVisual color={color} stacks={1} loadFrac={loadFrac} />}
      {def.type === "battery" && <BatteryVisual color={color} />}
      {def.type === "interconnector" && (
        <InterconnectorVisual color={color} linkCount={def.countries?.length ?? 1} />
      )}

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

      {showLabel && (
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
            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {def.countries?.map((c) =>
                COUNTRY_CHIP[c] ? (
                  <span
                    key={c}
                    style={{
                      background: COUNTRY_CHIP[c].color,
                      color: c === "Belgium" ? "#1a202c" : "white",
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 4px",
                      borderRadius: 3,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {COUNTRY_CHIP[c].code}
                  </span>
                ) : null,
              )}
              {def.name}
            </div>
            {hover && (
              <div style={{ fontWeight: 700, color: color, maxWidth: 210, whiteSpace: "normal", marginTop: 2 }}>
                {MARKET_ROLE[def.type]}
              </div>
            )}
            {hover && def.realLinks && (
              <div style={{ opacity: 0.7, maxWidth: 210, whiteSpace: "normal", marginTop: 2, fontSize: 10.5 }}>
                {def.realLinks}
              </div>
            )}
            <div style={{ opacity: 0.85, marginTop: hover ? 3 : 0 }}>
              {tripped ? "TRIPPED — offline" : `${Math.round(actualMW).toLocaleString()} MW / ${def.capacityMW.toLocaleString()} MW`}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
