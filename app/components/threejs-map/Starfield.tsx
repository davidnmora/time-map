"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import {
  STARFIELD_CIRCLE_TEXTURE_URL,
  STARFIELD_HSL_HUE,
  STARFIELD_HSL_SATURATION,
  STARFIELD_MIN_RADIUS,
  STARFIELD_POINT_SIZE,
  STARFIELD_RADIUS_SPREAD,
  STARFIELD_STAR_COUNT,
} from "./constants";

type StarSample = {
  pos: THREE.Vector3;
  update: (t: number) => number;
  minDist: number;
};

function randomSpherePoint(): StarSample {
  const radius = Math.random() * STARFIELD_RADIUS_SPREAD + STARFIELD_MIN_RADIUS;
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  const rate = Math.random() * 1;
  const prob = Math.random();
  const light = Math.random();
  const update = (t: number) => {
    const lightness = prob > 0.8 ? light + Math.sin(t * rate) * 1 : light;
    return lightness;
  };
  return {
    pos: new THREE.Vector3(x, y, z),
    update,
    minDist: radius,
  };
}

function buildPoints(
  starTexture: THREE.Texture,
  numStars: number,
): THREE.Points {
  const positions: StarSample[] = [];
  const verts: number[] = [];
  const initialColors: number[] = [];
  for (let i = 0; i < numStars; i += 1) {
    const sample = randomSpherePoint();
    positions.push(sample);
    const { pos } = sample;
    verts.push(pos.x, pos.y, pos.z);
    const col = new THREE.Color().setHSL(
      STARFIELD_HSL_HUE,
      STARFIELD_HSL_SATURATION,
      Math.random(),
    );
    initialColors.push(col.r, col.g, col.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(initialColors, 3),
  );
  const mat = new THREE.PointsMaterial({
    size: STARFIELD_POINT_SIZE,
    vertexColors: true,
    map: starTexture,
  });
  const points = new THREE.Points(geo, mat);
  const updateColors = (t: number) => {
    const nextColors: number[] = [];
    for (let i = 0; i < numStars; i += 1) {
      const sample = positions[i];
      const bright = sample.update(t);
      const col = new THREE.Color().setHSL(
        STARFIELD_HSL_HUE,
        STARFIELD_HSL_SATURATION,
        bright,
      );
      nextColors.push(col.r, col.g, col.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(nextColors, 3));
    geo.attributes.color.needsUpdate = true;
  };
  points.userData = { update: updateColors };
  return points;
}

export default function Starfield() {
  const starTexture = useLoader(
    THREE.TextureLoader,
    STARFIELD_CIRCLE_TEXTURE_URL,
  );
  const points = useMemo(
    () => buildPoints(starTexture, STARFIELD_STAR_COUNT),
    [starTexture],
  );
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    const target = ref.current;
    if (!target) {
      return;
    }
    target.userData.update(state.clock.elapsedTime);
  });
  return <primitive object={points} ref={ref} />;
}
