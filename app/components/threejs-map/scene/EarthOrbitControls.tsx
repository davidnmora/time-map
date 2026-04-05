"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ORBIT_DAMPING_FACTOR,
  ORBIT_MAX_DISTANCE,
  ORBIT_MIN_DISTANCE_FROM_CENTER,
  ORBIT_ROTATE_RESPONSE_SHARPNESS,
  ORBIT_ROTATE_SPEED_FAR,
  ORBIT_ROTATE_SPEED_NEAR,
  ORBIT_TARGET,
  ORBIT_ZOOM_SPEED_CURVE_EXPONENT,
  ORBIT_ZOOM_SPEED_FAR,
  ORBIT_ZOOM_SPEED_NEAR,
} from "./constants";

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

export default function EarthOrbitControls() {
  const ref = useRef<OrbitControlsImpl>(null);

  useFrame(() => {
    const controls = ref.current;
    if (!controls) {
      return;
    }
    controls.target.set(
      ORBIT_TARGET[0],
      ORBIT_TARGET[1],
      ORBIT_TARGET[2],
    );
    controls.minDistance = ORBIT_MIN_DISTANCE_FROM_CENTER;
    const distance = controls.getDistance();
    const zoomT = normalizedDistanceToTargetRange(
      distance,
      ORBIT_MIN_DISTANCE_FROM_CENTER,
      ORBIT_MAX_DISTANCE,
    );
    const zoomResponsiveness = Math.pow(zoomT, ORBIT_ZOOM_SPEED_CURVE_EXPONENT);
    controls.zoomSpeed =
      ORBIT_ZOOM_SPEED_NEAR +
      zoomResponsiveness * (ORBIT_ZOOM_SPEED_FAR - ORBIT_ZOOM_SPEED_NEAR);
    const rotateResponsiveness = exponentialSaturate01(
      zoomT,
      ORBIT_ROTATE_RESPONSE_SHARPNESS,
    );
    controls.rotateSpeed =
      ORBIT_ROTATE_SPEED_NEAR +
      rotateResponsiveness * (ORBIT_ROTATE_SPEED_FAR - ORBIT_ROTATE_SPEED_NEAR);
  });

  return (
    <OrbitControls
      ref={ref}
      enableDamping
      dampingFactor={ORBIT_DAMPING_FACTOR}
      enablePan={false}
      maxDistance={ORBIT_MAX_DISTANCE}
      minDistance={ORBIT_MIN_DISTANCE_FROM_CENTER}
      target={ORBIT_TARGET}
      rotateSpeed={ORBIT_ROTATE_SPEED_NEAR}
      zoomSpeed={ORBIT_ZOOM_SPEED_NEAR}
    />
  );
}
