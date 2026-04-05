"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  ORBIT_DAMPING_FACTOR,
  ORBIT_MAX_DISTANCE,
  ORBIT_MIN_DISTANCE_FROM_CENTER,
  ORBIT_TARGET,
  ORBIT_ZOOM_SPEED_CURVE_EXPONENT,
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
    controls.target.set(
      ORBIT_TARGET[0],
      ORBIT_TARGET[1],
      ORBIT_TARGET[2],
    );
    controls.minDistance = ORBIT_MIN_DISTANCE_FROM_CENTER;
    const distance = controls.getDistance();
    const span = ORBIT_MAX_DISTANCE - ORBIT_MIN_DISTANCE_FROM_CENTER;
    const zoomT =
      span > 0
        ? Math.max(
            0,
            Math.min(
              1,
              (distance - ORBIT_MIN_DISTANCE_FROM_CENTER) / span,
            ),
          )
        : 0;
    const responsiveness = Math.pow(zoomT, ORBIT_ZOOM_SPEED_CURVE_EXPONENT);
    controls.zoomSpeed =
      ORBIT_ZOOM_SPEED_NEAR +
      responsiveness * (ORBIT_ZOOM_SPEED_FAR - ORBIT_ZOOM_SPEED_NEAR);
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
      zoomSpeed={ORBIT_ZOOM_SPEED_NEAR}
    />
  );
}
