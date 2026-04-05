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
  ORBIT_ROTATE_RESPONSE_SHARPNESS,
  ORBIT_ROTATE_SPEED_FAR,
  ORBIT_ROTATE_SPEED_NEAR,
  ORBIT_TARGET,
} from "./constants";
import useMapboxStyleZoom from "./useMapboxStyleZoom";

const CAMERA_SETTLED_THRESHOLD_SQ = 1e-8;

function normalizedDistanceToTargetRange(
  distance: number,
  minDistance: number,
  maxDistance: number,
) {
  const span = maxDistance - minDistance;
  if (span <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, (distance - minDistance) / span));
}

function exponentialSaturate01(normalizedDistance: number, sharpness: number) {
  const t = Math.max(0, Math.min(1, normalizedDistance));
  if (sharpness <= 0) {
    return t;
  }
  const expSharpness = Math.exp(sharpness);
  const denominator = expSharpness - 1;
  if (denominator === 0) {
    return t;
  }
  return (Math.exp(sharpness * t) - 1) / denominator;
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

  useMapboxStyleZoom(ref);

  useFrame(() => {
    const controls = ref.current;
    if (!controls) {
      return;
    }
    controls.target.set(ORBIT_TARGET[0], ORBIT_TARGET[1], ORBIT_TARGET[2]);
    controls.minDistance = ORBIT_MIN_DISTANCE_FROM_CENTER;

    const distance = controls.getDistance();
    const zoomT = normalizedDistanceToTargetRange(
      distance,
      ORBIT_MIN_DISTANCE_FROM_CENTER,
      ORBIT_MAX_DISTANCE,
    );
    const rotateResponsiveness = exponentialSaturate01(
      zoomT,
      ORBIT_ROTATE_RESPONSE_SHARPNESS,
    );
    controls.rotateSpeed =
      ORBIT_ROTATE_SPEED_NEAR +
      rotateResponsiveness *
        (ORBIT_ROTATE_SPEED_FAR - ORBIT_ROTATE_SPEED_NEAR);

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
      rotateSpeed={ORBIT_ROTATE_SPEED_NEAR}
    />
  );
}
