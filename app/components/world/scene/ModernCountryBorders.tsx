"use client";

import { useLayoutEffect, useRef } from "react";
import type { GeoJSON } from "geojson";
import { useThree } from "@react-three/fiber";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import * as THREE from "three";
import type { GeographicRegionMapLayer } from "@/lib/regions/types";
import { drawThreeGeo } from "@/lib/geo/threeGeoJSON";
import {
  EARTH_ICOSAHEDRON_RADIUS,
  GEOJSON_OVERLAY_LINE_COLOR,
  GEOJSON_OVERLAY_LINE_WIDTH_PX,
} from "./constants";

type ModernCountryBordersProps = {
  regions: GeographicRegionMapLayer[];
};

function disposeSubtreeResources(root: THREE.Object3D) {
  root.traverse((child) => {
    if (child instanceof Line2) {
      child.geometry.dispose();
      child.material.dispose();
      return;
    }
    if (child instanceof THREE.Line || child instanceof THREE.Points) {
      child.geometry.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat.dispose();
      }
    }
  });
}

function resolveLineColor(
  lineColor: string | undefined,
  fallback: number
): number {
  if (lineColor === undefined) {
    return fallback;
  }
  return new THREE.Color(lineColor).getHex();
}

export default function ModernCountryBorders({
  regions,
}: ModernCountryBordersProps) {
  const { width, height } = useThree((s) => s.size);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const root = groupRef.current;
    if (!root) {
      return;
    }

    disposeSubtreeResources(root);
    root.clear();

    const resolution = new THREE.Vector2(width, height);

    for (const region of regions) {
      const subGroup = new THREE.Group();
      subGroup.name = region.id;
      const lineWidth =
        region.lineWidth ?? GEOJSON_OVERLAY_LINE_WIDTH_PX;
      const color = resolveLineColor(
        region.lineColor,
        GEOJSON_OVERLAY_LINE_COLOR
      );
      drawThreeGeo(
        region.data as GeoJSON,
        EARTH_ICOSAHEDRON_RADIUS,
        "sphere",
        { color },
        subGroup,
        { resolution, pixelWidth: lineWidth }
      );
      root.add(subGroup);
    }

    return () => {
      disposeSubtreeResources(root);
      root.clear();
    };
  }, [regions, width, height]);

  return <group ref={groupRef} />;
}
