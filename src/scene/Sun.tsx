import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "../sim/store";

const ARC_RADIUS = 46;
const ARC_HEIGHT = 34;
const SUNRISE = 6;
const SUNSET = 20;

/** Sun (day) or moon (night) arcing across the sky, synced to hourOfDay. */
export function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame(() => {
    const s = useSimStore.getState();
    const hour = s.demandMode === "dayCycle" ? s.hourOfDay : 13;
    const isDay = hour >= SUNRISE && hour <= SUNSET;

    const t = isDay
      ? (hour - SUNRISE) / (SUNSET - SUNRISE)
      : ((hour < SUNRISE ? hour + 24 : hour) - SUNSET) / (24 - (SUNSET - SUNRISE));
    const angle = t * Math.PI;
    const x = -Math.cos(angle) * ARC_RADIUS;
    const y = Math.sin(angle) * ARC_HEIGHT + 2;
    const z = -10;

    if (sunRef.current) {
      sunRef.current.visible = isDay;
      sunRef.current.position.set(x, y, z);
    }
    if (moonRef.current) {
      moonRef.current.visible = !isDay;
      moonRef.current.position.set(x, y, z);
    }
    if (lightRef.current) {
      lightRef.current.position.set(x, Math.max(y, 4), z);
      const elevation = Math.max(0, Math.sin(angle));
      lightRef.current.intensity = isDay ? 0.5 + elevation * 0.8 : 0.15;
      lightRef.current.color.set(isDay ? (elevation < 0.25 ? "#fdba74" : "#fff7ed") : "#93c5fd");
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = isDay ? 0.45 : 0.2;
    }
  });

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight ref={lightRef} position={[15, 25, 10]} intensity={1.1} castShadow />
      <mesh ref={sunRef}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh ref={moonRef}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#93c5fd" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}
