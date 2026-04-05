"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  EARTH_ICOSAHEDRON_RADIUS,
  ORBIT_DAMPING_FACTOR,
  ORBIT_MAX_DISTANCE,
  ORBIT_MIN_CAMERA_TO_TARGET_AT_SURFACE,
  ORBIT_SURFACE_CLEARANCE,
  ORBIT_ZOOM_SPEED_FAR,
  ORBIT_ZOOM_SPEED_NEAR,
} from "./constants";

export default function EarthOrbitControls() {
  const ref = useRef<OrbitControlsImpl>(null);

  useFrame(() => {
    const controls = ref.current;
    if (!controls) {
      return;
    }
    const targetRadius = controls.target.length();
    const clearanceFromCenter =
      EARTH_ICOSAHEDRON_RADIUS + ORBIT_SURFACE_CLEARANCE - targetRadius;
    controls.minDistance = Math.max(
      ORBIT_MIN_CAMERA_TO_TARGET_AT_SURFACE,
      clearanceFromCenter,
    );

    const distance = controls.getDistance();
    const span = ORBIT_MAX_DISTANCE - controls.minDistance;
    const zoomT =
      span > 0
        ? Math.max(
            0,
            Math.min(1, (distance - controls.minDistance) / span),
          )
        : 0;
    controls.zoomSpeed =
      ORBIT_ZOOM_SPEED_NEAR + zoomT * (ORBIT_ZOOM_SPEED_FAR - ORBIT_ZOOM_SPEED_NEAR);
  });

  return (
    <OrbitControls
      ref={ref}
      enableDamping
      dampingFactor={ORBIT_DAMPING_FACTOR}
      maxDistance={ORBIT_MAX_DISTANCE}
      zoomSpeed={ORBIT_ZOOM_SPEED_NEAR}
      zoomToCursor
    />
  );
}
