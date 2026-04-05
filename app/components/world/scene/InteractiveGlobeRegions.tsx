"use client";

import { useState } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { InteractiveGeographicRegionMapLayer } from "@/lib/regions/types";
import { doesRegionIdMatch } from "@/lib/regions/region-utils";
import { isTimeRangeActive } from "@/app/data/data-utils";
import { createRegionGeometry, FILL_SURFACE_OFFSET } from "@/lib/geo/globe-region-utils";
import { EARTH_ICOSAHEDRON_RADIUS } from "./constants";

const HOVERED_ACTIVE_OPACITY = 0.5;
const HOVERED_INACTIVE_OPACITY = 0.15;
const NOT_HOVERED_ACTIVE_OPACITY = 0.3;
const NOT_HOVERED_INACTIVE_OPACITY = 0;

const FILL_RADIUS = EARTH_ICOSAHEDRON_RADIUS + FILL_SURFACE_OFFSET;
const FILL_RENDER_ORDER = 10;

function getRegionFillOpacity(isHovered: boolean, isActive: boolean): number {
  if (isHovered)
    return isActive ? HOVERED_ACTIVE_OPACITY : HOVERED_INACTIVE_OPACITY;
  return isActive ? NOT_HOVERED_ACTIVE_OPACITY : NOT_HOVERED_INACTIVE_OPACITY;
}

type RegionMeshProps = {
  region: InteractiveGeographicRegionMapLayer;
  isHovered: boolean;
  isActive: boolean;
  onPointerOver: (
    e: ThreeEvent<PointerEvent>,
    region: InteractiveGeographicRegionMapLayer,
  ) => void;
  onPointerOut: () => void;
};

function RegionMesh({
  region,
  isHovered,
  isActive,
  onPointerOver,
  onPointerOut,
}: RegionMeshProps) {
  const [geometry] = useState<THREE.BufferGeometry | null>(() =>
    createRegionGeometry(region.data, FILL_RADIUS)
  );
  if (!geometry) return null;

  const opacity = getRegionFillOpacity(isHovered, isActive);
  const isVisible = opacity > 0;

  return (
    <mesh
      geometry={geometry}
      visible={isVisible}
      renderOrder={FILL_RENDER_ORDER}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver(e, region);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut();
      }}
    >
      <meshBasicMaterial
        color={region.fillColor}
        transparent
        opacity={opacity}
        side={THREE.FrontSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}

type InteractiveGlobeRegionsProps = {
  regions: InteractiveGeographicRegionMapLayer[];
  currentYear: number;
  hoveredRegionId: string | null;
  onRegionHoverStart: (
    region: InteractiveGeographicRegionMapLayer,
    clientX: number,
    clientY: number,
  ) => void;
  onRegionHoverEnd: () => void;
};

export default function InteractiveGlobeRegions({
  regions,
  currentYear,
  hoveredRegionId,
  onRegionHoverStart,
  onRegionHoverEnd,
}: InteractiveGlobeRegionsProps) {
  const handlePointerOver = (
    e: ThreeEvent<PointerEvent>,
    region: InteractiveGeographicRegionMapLayer,
  ) => {
    onRegionHoverStart(region, e.clientX, e.clientY);
  };

  return (
    <group>
      {regions.map((region) => {
        const isHovered =
          hoveredRegionId !== null &&
          doesRegionIdMatch(region.id, hoveredRegionId);
        const isActive = isTimeRangeActive(region.timeRange, currentYear);

        return (
          <RegionMesh
            key={region.id}
            region={region}
            isHovered={isHovered}
            isActive={isActive}
            onPointerOver={handlePointerOver}
            onPointerOut={onRegionHoverEnd}
          />
        );
      })}
    </group>
  );
}
