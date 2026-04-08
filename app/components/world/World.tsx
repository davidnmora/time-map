"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import type {
  GeographicRegionMapLayer,
  InteractiveGeographicRegionMapLayer,
} from "@/lib/regions/types";
import type { TooltipData } from "@/lib/regions/region-utils";
import {
  useAppState,
  type CameraPosition,
} from "@/app/contexts/AppStateContext";
import { useHoveredElement } from "@/app/contexts/HoveredElementContext";
import { RegionTooltip } from "@/app/components/shared/RegionTooltip";
import Earth from "./scene/Earth";
import CameraViewOffsetController from "./controls/CameraViewOffsetController";
import EarthOrbitControls from "./controls/EarthOrbitControls";
import ModernCountryBorders from "./scene/ModernCountryBorders";
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
const EMPTY_INTERACTIVE_REGIONS: InteractiveGeographicRegionMapLayer[] = [];
const CAMERA_OFFSET_HALF_SHIFT_MULTIPLIER = 0.5;

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

type WorldProps = {
  modernCountryBorders?: GeographicRegionMapLayer[];
  interactiveRegions?: InteractiveGeographicRegionMapLayer[];
  timelineWidth: number;
  timelineExpanded: boolean;
};

export default function World({
  modernCountryBorders = EMPTY_REGIONS,
  interactiveRegions = EMPTY_INTERACTIVE_REGIONS,
  timelineWidth,
  timelineExpanded,
}: WorldProps) {
  const { cameraPosition, currentYear, updateState } = useAppState();
  const { hoveredRegionId, setHoveredRegionId } = useHoveredElement();
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);
  const [
    canvasInteractionIsCurrentlyHappening,
    setCanvasInteractionIsCurrentlyHappening,
  ] = useState(false);
  const cameraTargetOffsetPx = timelineExpanded
    ? timelineWidth * CAMERA_OFFSET_HALF_SHIFT_MULTIPLIER
    : 0;

  const handleCameraSettled = (position: CameraPosition) => {
    updateState({ cameraPosition: position });
  };

  const handleRegionHoverStart = (
    region: InteractiveGeographicRegionMapLayer,
    clientX: number,
    clientY: number,
  ) => {
    if (canvasInteractionIsCurrentlyHappening) {
      return;
    }
    setHoveredRegionId(region.metadata?.id || region.id);
    setTooltipState({ data: buildTooltipData(region), x: clientX, y: clientY });
  };

  const handleRegionHoverEnd = () => {
    setHoveredRegionId(null);
    setTooltipState(null);
  };

  const handleCanvasInteractionStart = () => {
    setCanvasInteractionIsCurrentlyHappening(true);
    setHoveredRegionId(null);
    setTooltipState(null);
  };

  const handleCanvasInteractionEnd = () => {
    setCanvasInteractionIsCurrentlyHappening(false);
  };

  const { x, y, z } = SUN_DIRECTION;
  return (
    <div
      className="h-full w-full min-h-0"
      onPointerMove={(e) => {
        setTooltipState((prev) =>
          prev && !canvasInteractionIsCurrentlyHappening
            ? { ...prev, x: e.clientX, y: e.clientY }
            : null,
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
          <CameraViewOffsetController targetOffsetPx={cameraTargetOffsetPx} />
          <Earth>
            {modernCountryBorders.length > 0 && (
              <ModernCountryBorders regions={modernCountryBorders} />
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
          <EarthOrbitControls
            onCameraSettled={handleCameraSettled}
            onInteractionStart={handleCanvasInteractionStart}
            onInteractionEnd={handleCanvasInteractionEnd}
          />
        </Suspense>
      </Canvas>
      {tooltipState && !canvasInteractionIsCurrentlyHappening && (
        <RegionTooltip
          data={tooltipState.data}
          x={tooltipState.x}
          y={tooltipState.y}
        />
      )}
    </div>
  );
}
