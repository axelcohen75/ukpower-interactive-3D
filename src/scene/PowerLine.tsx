import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PowerLineProps {
  from: [number, number, number];
  to: [number, number, number];
  /** Live power flow in MW, read imperatively each frame (no React re-render). */
  getFlowMW: () => number;
  maxMW: number;
  color?: string;
  particleCount?: number;
  thick?: boolean;
}

/**
 * A cable between two points with small glowing particles flowing along it.
 * Particle speed/density scales with the live power flow, direction flips
 * with the sign of the flow — the visual "current".
 */
export function PowerLine({
  from,
  to,
  getFlowMW,
  maxMW,
  color = "#7dd3fc",
  particleCount = 10,
  thick = false,
}: PowerLineProps) {
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [from, to]);
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

  const instRef = useRef<THREE.InstancedMesh>(null);
  const progress = useRef<number[]>(
    Array.from({ length: particleCount }, (_, i) => i / particleCount),
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const flow = getFlowMW();
    const frac = THREE.MathUtils.clamp(Math.abs(flow) / Math.max(maxMW, 1), 0, 1);
    const dirSign = flow >= 0 ? 1 : -1;
    const speed = (0.05 + frac * 0.9) * dirSign;
    const mesh = instRef.current;
    if (!mesh) return;
    mesh.visible = frac > 0.01;
    for (let i = 0; i < particleCount; i++) {
      let p = progress.current[i] + speed * delta;
      p = ((p % 1) + 1) % 1;
      progress.current[i] = p;
      const pos = start.clone().lerp(end, p);
      dummy.position.copy(pos);
      const scale = 0.06 + frac * 0.1;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={mid} quaternion={quaternion}>
        <cylinderGeometry args={[thick ? 0.06 : 0.03, thick ? 0.06 : 0.03, length, 6]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} roughness={0.4} />
      </mesh>
      <instancedMesh ref={instRef} args={[undefined, undefined, particleCount]}>
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
