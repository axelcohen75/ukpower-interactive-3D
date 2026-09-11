import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useUiStore, type ViewId } from "../ui/uiStore";
import { VIEWS } from "./views";

/**
 * Drives the camera to a preset framing whenever the active view changes,
 * then hands control back to OrbitControls (zoom only) once it arrives.
 * This is a guided tour, not a free-roam 3D viewer — the focus buttons are
 * the primary way to navigate.
 */
export function CameraRig({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...VIEWS.overview.position));
  const targetLook = useRef(new THREE.Vector3(...VIEWS.overview.target));
  const lastView = useRef<ViewId>("overview");
  const animT = useRef(0);

  useFrame((_, delta) => {
    const view = useUiStore.getState().activeView;
    if (view !== lastView.current) {
      lastView.current = view;
      const v = VIEWS[view];
      targetPos.current.set(...v.position);
      targetLook.current.set(...v.target);
      animT.current = 1.5;
    }
    if (animT.current > 0) {
      animT.current -= delta;
      const a = Math.min(1, delta * 2.6);
      camera.position.lerp(targetPos.current, a);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, a);
        controlsRef.current.update();
      }
    }
  });

  return null;
}
