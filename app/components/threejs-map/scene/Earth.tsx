"use client";

import type { ReactNode } from "react";
import AtmosphereMesh from "./AtmosphereMesh";
import EarthMaterial from "./EarthMaterial";
import {
  EARTH_AXIAL_TILT_DEGREES,
  EARTH_ICOSAHEDRON_DETAIL,
  EARTH_ICOSAHEDRON_RADIUS,
  SUN_DIRECTION,
} from "./constants";

type EarthProps = {
  children?: ReactNode;
};

export default function Earth({ children }: EarthProps) {
  const axialTiltRadians = (EARTH_AXIAL_TILT_DEGREES * Math.PI) / 180;
  return (
    <group rotation={[0, 0, axialTiltRadians]}>
      <mesh>
        <icosahedronGeometry
          args={[EARTH_ICOSAHEDRON_RADIUS, EARTH_ICOSAHEDRON_DETAIL]}
        />
        <EarthMaterial sunDirection={SUN_DIRECTION} />
        <AtmosphereMesh />
      </mesh>
      {children}
    </group>
  );
}
