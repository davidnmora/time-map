"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { ORBIT_MAX_DISTANCE } from "./constants";

const CIRCLE_TEXTURE_URL = "/world/circle.png";
const POINT_SIZE = 0.2;
const STAR_COUNT = 3000;
const HSL_HUE = 0.6;
const HSL_SATURATION = 0.2;
const BEYOND_MAX_ZOOM_BUFFER = 1.2;
const MIN_RADIUS = ORBIT_MAX_DISTANCE * BEYOND_MAX_ZOOM_BUFFER;
const RADIUS_SPREAD = ORBIT_MAX_DISTANCE * 0.5;

type StarSample = {
  pos: THREE.Vector3;
  update: (t: number) => number;
  minDist: number;
};

function randomSpherePoint(): StarSample {
  const radius = Math.random() * RADIUS_SPREAD + MIN_RADIUS;
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
      HSL_HUE,
      HSL_SATURATION,
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
    size: POINT_SIZE,
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
        HSL_HUE,
        HSL_SATURATION,
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
  const starTexture = useLoader(THREE.TextureLoader, CIRCLE_TEXTURE_URL);
  const points = useMemo(
    () => buildPoints(starTexture, STAR_COUNT),
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
