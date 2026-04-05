"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { GeographicRegionMapLayer } from "@/app/components/map/geographic-region-map-layer";
import {
  useAppState,
  type CameraPosition,
} from "@/app/contexts/AppStateContext";
import Earth from "./scene/Earth";
import EarthOrbitControls from "./scene/EarthOrbitControls";
import GeoJsonGlobeOverlay from "./scene/GeoJsonGlobeOverlay";
import Moon from "./scene/Moon";
import Starfield from "./scene/Starfield";
import Sun from "./scene/Sun";
import {
  CAMERA_FAR,
  CANVAS_TONE_MAPPING,
  MAX_DEVICE_PIXEL_RATIO,
  SUN_DIRECTION,
} from "./scene/constants";

const HEMISPHERE_SKY = 0xffffff;
const HEMISPHERE_GROUND = 0x000000;
const HEMISPHERE_INTENSITY = 3.0;

const EMPTY_GEOGRAPHIC_REGION_MAP_LAYERS: GeographicRegionMapLayer[] = [];

type ThreeJSMapProps = {
  geographicRegions?: GeographicRegionMapLayer[];
};

export default function ThreeJSMap({
  geographicRegions = EMPTY_GEOGRAPHIC_REGION_MAP_LAYERS,
}: ThreeJSMapProps) {
  const { cameraPosition, updateState } = useAppState();

  const handleCameraSettled = (position: CameraPosition) => {
    updateState({ cameraPosition: position });
  };

  const { x, y, z } = SUN_DIRECTION;
  return (
    <div className="h-full w-full min-h-0">
      <Canvas
        camera={{ position: cameraPosition, far: CAMERA_FAR }}
        dpr={[1, MAX_DEVICE_PIXEL_RATIO]}
        resize={{ scroll: false }}
        gl={{
          toneMapping: CANVAS_TONE_MAPPING,
          antialias: true,
          logarithmicDepthBuffer: true,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <Earth>
            {geographicRegions.length > 0 ? (
              <GeoJsonGlobeOverlay regions={geographicRegions} />
            ) : null}
          </Earth>
          <hemisphereLight
            args={[HEMISPHERE_SKY, HEMISPHERE_GROUND, HEMISPHERE_INTENSITY]}
          />
          <directionalLight position={[x, y, z]} />
          <Sun />
          <Moon />
          <Starfield />
          <EarthOrbitControls onCameraSettled={handleCameraSettled} />
        </Suspense>
      </Canvas>
    </div>
  );
}
