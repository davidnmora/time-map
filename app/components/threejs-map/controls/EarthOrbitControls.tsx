"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { CameraPosition } from "@/app/contexts/AppStateContext";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ORBIT_DAMPING_FACTOR,
  ORBIT_MAX_DISTANCE,
  ORBIT_MIN_DISTANCE_FROM_CENTER,
  ORBIT_ROTATE_PROXIMITY_DAMPENING,
  ORBIT_ROTATE_TRACKING_SCALE,
  ORBIT_TARGET,
} from "../scene/constants";
import useEasedOrbitZoom from "./useEasedOrbitZoom";

const CAMERA_SETTLED_THRESHOLD_SQ = 1e-8;

function computeSurfaceTrackingRotateSpeed(
  camera: THREE.Camera,
  distance: number,
): number {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return 1;
  }
  const halfFovTan = Math.tan(
    THREE.MathUtils.degToRad(camera.fov / 2),
  );
  const geometricSpeed =
    (distance * halfFovTan) / ORBIT_ROTATE_TRACKING_SCALE;
  const proximityFactor =
    1 -
    ORBIT_ROTATE_PROXIMITY_DAMPENING *
      Math.sqrt(ORBIT_MIN_DISTANCE_FROM_CENTER / distance);
  return geometricSpeed * proximityFactor;
}

type EarthOrbitControlsProps = {
  onCameraSettled: (position: CameraPosition) => void;
};

export default function EarthOrbitControls({
  onCameraSettled,
}: EarthOrbitControlsProps) {
  const ref = useRef<OrbitControlsImpl>(null);
  const hasPendingChangeRef = useRef(false);
  const lastFramePositionRef = useRef(new THREE.Vector3());

  useEasedOrbitZoom(ref);

  useFrame(() => {
    const controls = ref.current;
    if (!controls) {
      return;
    }
    controls.target.set(ORBIT_TARGET[0], ORBIT_TARGET[1], ORBIT_TARGET[2]);
    controls.minDistance = ORBIT_MIN_DISTANCE_FROM_CENTER;

    const distance = controls.getDistance();
    controls.rotateSpeed = computeSurfaceTrackingRotateSpeed(
      controls.object,
      distance,
    );

    const currentPosition = controls.object.position;
    if (hasPendingChangeRef.current) {
      const deltaSquared = currentPosition.distanceToSquared(
        lastFramePositionRef.current,
      );
      if (deltaSquared < CAMERA_SETTLED_THRESHOLD_SQ) {
        onCameraSettled([
          currentPosition.x,
          currentPosition.y,
          currentPosition.z,
        ]);
        hasPendingChangeRef.current = false;
      }
    }
    lastFramePositionRef.current.copy(currentPosition);
  });

  return (
    <OrbitControls
      ref={ref}
      onStart={() => {
        hasPendingChangeRef.current = true;
      }}
      enableDamping
      dampingFactor={ORBIT_DAMPING_FACTOR}
      enableZoom={false}
      enablePan={false}
      maxDistance={ORBIT_MAX_DISTANCE}
      minDistance={ORBIT_MIN_DISTANCE_FROM_CENTER}
      target={ORBIT_TARGET}
    />
  );
}
