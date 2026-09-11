import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useUiStore, type ViewId } from "../ui/uiStore";

interface Zone {
  view: ViewId;
  color: string;
  position: [number, number, number];
  radius: number;
}

const ZONES: Zone[] = [
  { view: "generation", color: "#f2c744", position: [-26.5, 0.02, 0], radius: 11 },
  { view: "transmission", color: "#f6ad55", position: [-11, 0.02, 0], radius: 8 },
  { view: "distribution", color: "#68d391", position: [10, 0.02, 0], radius: 7 },
  { view: "consumption", color: "#7dd3fc", position: [19, 0.02, -1], radius: 11 },
];

function makeGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.22)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/**
 * A soft glow on the ground under each of the 4 stages, replacing floating
 * text signposts. Brightens under whichever stage the view-tab buttons
 * currently focus, stays faint in the overview, and dims elsewhere — a
 * quiet, modern way to show "this is the zone you picked" without clutter.
 */
export function ZoneHighlights() {
  const texture = useMemo(() => makeGlowTexture(), []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const opacities = useRef<number[]>(ZONES.map(() => 0.12));

  useFrame((_, delta) => {
    const active = useUiStore.getState().activeView;
    ZONES.forEach((z, i) => {
      const target = active === z.view ? 0.7 : active === "overview" ? 0.4 : 0.025;
      opacities.current[i] += (target - opacities.current[i]) * Math.min(1, delta * 4);
      const mesh = refs.current[i];
      if (mesh) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacities.current[i];
      }
    });
  });

  return (
    <>
      {ZONES.map((z, i) => (
        <mesh
          key={z.view}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={z.position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[z.radius, 48]} />
          <meshBasicMaterial
            map={texture}
            color={z.color}
            transparent
            opacity={0.12}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}
