"use client";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import {
  MOON_DISTANCE,
  MOON_ORBITAL_ANGLE_RAD,
  MOON_ORBITAL_INCLINATION_DEGREES,
  MOON_RADIUS,
} from "./constants";

const MOON_TEXTURE_URL = "/threejs-map/textures/moon-2k.jpg";
const SPHERE_SEGMENTS = 32;
const ORBIT_RING_SEGMENTS = 256;
const ORBIT_RING_COLOR = 0x555577;
const ORBIT_RING_OPACITY = 0.25;

const INCLINATION_RAD =
  (MOON_ORBITAL_INCLINATION_DEGREES * Math.PI) / 180;

const MOON_POSITION: [number, number, number] = [
  Math.cos(MOON_ORBITAL_ANGLE_RAD) * MOON_DISTANCE,
  0,
  Math.sin(MOON_ORBITAL_ANGLE_RAD) * MOON_DISTANCE,
];

function buildOrbitRingGeometry() {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < ORBIT_RING_SEGMENTS; i++) {
    const angle = (i / ORBIT_RING_SEGMENTS) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * MOON_DISTANCE,
        0,
        Math.sin(angle) * MOON_DISTANCE,
      ),
    );
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

const ORBIT_RING_GEOMETRY = buildOrbitRingGeometry();

export default function Moon() {
  const moonTexture = useLoader(THREE.TextureLoader, MOON_TEXTURE_URL);

  return (
    <group rotation={[INCLINATION_RAD, 0, 0]}>
      <mesh position={MOON_POSITION}>
        <sphereGeometry args={[MOON_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <meshStandardMaterial map={moonTexture} />
      </mesh>
      <lineLoop geometry={ORBIT_RING_GEOMETRY}>
        <lineBasicMaterial
          color={ORBIT_RING_COLOR}
          transparent
          opacity={ORBIT_RING_OPACITY}
        />
      </lineLoop>
    </group>
  );
}
