"use client";

import { useLayoutEffect, useRef } from "react";
import type { GeoJSON } from "geojson";
import { useThree } from "@react-three/fiber";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import * as THREE from "three";
import modernCountries from "@/app/data/modern-countries.json";
import { drawThreeGeo } from "@/lib/threeGeoJSON";
import {
  EARTH_ICOSAHEDRON_RADIUS,
  GEOJSON_OVERLAY_LINE_COLOR,
  GEOJSON_OVERLAY_LINE_WIDTH_PX,
} from "./constants";

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

export default function ModernCountriesGeo() {
  const { width, height } = useThree((s) => s.size);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const resolution = new THREE.Vector2(width, height);

    drawThreeGeo(
      modernCountries as GeoJSON,
      EARTH_ICOSAHEDRON_RADIUS,
      "sphere",
      { color: GEOJSON_OVERLAY_LINE_COLOR },
      group,
      { resolution, pixelWidth: GEOJSON_OVERLAY_LINE_WIDTH_PX }
    );

    return () => {
      disposeSubtreeResources(group);
      group.clear();
    };
  }, [width, height]);

  return <group ref={groupRef} />;
}
