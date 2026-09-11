import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type LineTier = "transmission" | "distribution";

interface PowerLineProps {
  from: [number, number, number];
  to: [number, number, number];
  /** Live power flow in MW, read imperatively each frame (no React re-render). */
  getFlowMW: () => number;
  maxMW: number;
  color?: string;
  /** Fixed cable thickness class — represents physical capacity/voltage,
   *  never changes with live flow. */
  tier?: LineTier;
}

const TIER_RADIUS: Record<LineTier, number> = {
  transmission: 0.09,
  distribution: 0.035,
};

const STRESS_COLOR = new THREE.Color("#ef4444");
const streamOffsets = [0, 0.018, 0.036, 0.054, 0.072];

/**
 * A cable between two points carrying one directional "stream" of light —
 * a short comet-trail of pulses moving together, not independent scattered
 * particles. Speed encodes flow magnitude, direction flips with the sign of
 * the flow, and color shifts toward red as the flow nears the line's
 * capacity. Cable thickness is fixed by `tier` (its physical capacity/
 * voltage class) and never reacts to live flow — only the stream does.
 */
export function PowerLine({
  from,
  to,
  getFlowMW,
  maxMW,
  color = "#7dd3fc",
  tier = "distribution",
}: PowerLineProps) {
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const length = useMemo(() => start.distanceTo(end), [start, end]);
  const dir = useMemo(() => end.clone().sub(start).normalize(), [start, end]);
  const mid = useMemo(
    () => start.clone().add(end).multiplyScalar(0.5),
    [start, end],
  );
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  const instRef = useRef<THREE.InstancedMesh>(null);
  const headProgress = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tintColor = useMemo(() => new THREE.Color(), []);

  const radius = TIER_RADIUS[tier];

  useFrame((_, delta) => {
    const flow = getFlowMW();
    const frac = THREE.MathUtils.clamp(Math.abs(flow) / Math.max(maxMW, 1), 0, 1);
    const dirSign = flow >= 0 ? 1 : -1;
    const speed = (0.06 + frac * 0.8) * dirSign;
    const mesh = instRef.current;
    if (!mesh) return;
    mesh.visible = frac > 0.01;

    headProgress.current = ((headProgress.current + speed * delta) % 1 + 1) % 1;
    tintColor.copy(baseColor).lerp(STRESS_COLOR, Math.max(0, frac - 0.6) / 0.4);

    for (let i = 0; i < streamOffsets.length; i++) {
      const p = ((headProgress.current - dirSign * streamOffsets[i]) % 1 + 1) % 1;
      const pos = start.clone().lerp(end, p);
      dummy.position.copy(pos);
      const fade = 1 - i / streamOffsets.length;
      const scale = radius * 1.8 * (0.6 + fade * 0.6);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tintColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={mid} quaternion={quaternion}>
        <cylinderGeometry args={[radius, radius, length, 8]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </mesh>
      <instancedMesh ref={instRef} args={[undefined, undefined, streamOffsets.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
