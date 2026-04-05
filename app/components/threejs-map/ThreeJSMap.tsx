"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import AtmosphereMesh from "./AtmosphereMesh";
import EarthMaterial from "./EarthMaterial";
import Nebula from "./Nebula";
import Starfield from "./Starfield";
import {
  CAMERA_INITIAL_POSITION,
  CANVAS_DPR_MAX,
  CANVAS_DPR_MIN,
  CANVAS_TONE_MAPPING,
  EARTH_AXIAL_TILT_DEGREES,
  EARTH_ICOSAHEDRON_DETAIL,
  EARTH_ICOSAHEDRON_RADIUS,
  HEMISPHERE_LIGHT_GROUND_COLOR,
  HEMISPHERE_LIGHT_INTENSITY,
  HEMISPHERE_LIGHT_SKY_COLOR,
  SUN_DIRECTION,
} from "./constants";

function Earth() {
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
    </group>
  );
}

export default function ThreeJSMap() {
  const { x, y, z } = SUN_DIRECTION;
  return (
    <div className="h-full w-full min-h-0">
      <Canvas
        camera={{ position: CAMERA_INITIAL_POSITION }}
        dpr={[CANVAS_DPR_MIN, CANVAS_DPR_MAX]}
        resize={{ scroll: false }}
        gl={{
          toneMapping: CANVAS_TONE_MAPPING,
          antialias: true,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Earth />
          <hemisphereLight
            args={[
              HEMISPHERE_LIGHT_SKY_COLOR,
              HEMISPHERE_LIGHT_GROUND_COLOR,
              HEMISPHERE_LIGHT_INTENSITY,
            ]}
          />
          <directionalLight position={[x, y, z]} />
          <Nebula />
          <Starfield />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
