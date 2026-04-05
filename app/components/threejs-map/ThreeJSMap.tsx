"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import type { GeographicRegionMapLayer } from "@/app/components/map/geographic-region-map-layer";
import type { TooltipData } from "@/app/components/map/map-utils";
import {
  useAppState,
  type CameraPosition,
} from "@/app/contexts/AppStateContext";
import { useHoveredElement } from "@/app/contexts/HoveredElementContext";
import { RegionTooltip } from "@/app/components/shared/RegionTooltip";
import Earth from "./scene/Earth";
import EarthOrbitControls from "./controls/EarthOrbitControls";
import GeoJsonGlobeOverlay from "./scene/GeoJsonGlobeOverlay";
import InteractiveGlobeRegions from "./scene/InteractiveGlobeRegions";
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

const EMPTY_REGIONS: GeographicRegionMapLayer[] = [];

type TooltipState = {
  data: TooltipData;
  x: number;
  y: number;
};

function buildTooltipData(region: GeographicRegionMapLayer): TooltipData {
  return {
    hierarchy: region.hierarchy || [],
    title: region.metadata?.title || "",
    description: region.metadata?.description,
    timeRange: region.timeRange || [0, null],
  };
}

type ThreeJSMapProps = {
  geographicRegions?: GeographicRegionMapLayer[];
  interactiveRegions?: GeographicRegionMapLayer[];
};

export default function ThreeJSMap({
  geographicRegions = EMPTY_REGIONS,
  interactiveRegions = EMPTY_REGIONS,
}: ThreeJSMapProps) {
  const { cameraPosition, currentYear, updateState } = useAppState();
  const { hoveredRegionId, setHoveredRegionId } = useHoveredElement();
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);

  const handleCameraSettled = (position: CameraPosition) => {
    updateState({ cameraPosition: position });
  };

  const handleRegionHoverStart = (
    region: GeographicRegionMapLayer,
    clientX: number,
    clientY: number,
  ) => {
    setHoveredRegionId(region.metadata?.id || region.id);
    setTooltipState({ data: buildTooltipData(region), x: clientX, y: clientY });
  };

  const handleRegionHoverEnd = () => {
    setHoveredRegionId(null);
    setTooltipState(null);
  };

  const { x, y, z } = SUN_DIRECTION;
  return (
    <div
      className="h-full w-full min-h-0"
      onPointerMove={(e) => {
        setTooltipState((prev) =>
          prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
        );
      }}
    >
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
            {geographicRegions.length > 0 && (
              <GeoJsonGlobeOverlay regions={geographicRegions} />
            )}
            {interactiveRegions.length > 0 && (
              <InteractiveGlobeRegions
                regions={interactiveRegions}
                currentYear={currentYear}
                hoveredRegionId={hoveredRegionId}
                onRegionHoverStart={handleRegionHoverStart}
                onRegionHoverEnd={handleRegionHoverEnd}
              />
            )}
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
      {tooltipState && (
        <RegionTooltip
          data={tooltipState.data}
          x={tooltipState.x}
          y={tooltipState.y}
        />
      )}
    </div>
  );
}
