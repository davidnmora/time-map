"use client";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import {
  MOON_DISTANCE,
  MOON_ORBITAL_ANGLE_RAD,
  MOON_ORBITAL_INCLINATION_DEGREES,
  MOON_RADIUS,
  SUN_DIRECTION,
} from "./constants";

const MOON_TEXTURE_URL = "/world/textures/moon-2k.jpg";
const SPHERE_SEGMENTS = 32;
const ORBIT_RING_SEGMENTS = 256;
const ORBIT_RING_COLOR = 0x555577;
const ORBIT_RING_OPACITY = 0.5;

const GLOW_COLOR = 0xaaaacc;
const GLOW_SCALE = 50;
const GLOW_OPACITY = 0.2;
const GLOW_FALLOFF = 20;
const GLOW_SPHERE_SEGMENTS = 10;

const MOON_AMBIENT_SCALE = 0.08;
const MOON_TERMINATOR_SHADOW_EDGE = -0.1;
const MOON_TERMINATOR_DAY_EDGE = 0.3;

const INCLINATION_RAD =
  (MOON_ORBITAL_INCLINATION_DEGREES * Math.PI) / 180;

const MOON_TEXTURE_Y_ROTATION = Math.PI - MOON_ORBITAL_ANGLE_RAD;

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

const SURFACE_VERTEX_SHADER = `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
    #include <logdepthbuf_vertex>
    vUv = uv;
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
  }
`;

const SURFACE_FRAGMENT_SHADER = `
  #include <logdepthbuf_pars_fragment>
  uniform sampler2D moonTexture;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vNormal);
    float sunOrientation = dot(normalize(sunDirection), normal);
    float dayMix = smoothstep(float(${MOON_TERMINATOR_SHADOW_EDGE}), float(${MOON_TERMINATOR_DAY_EDGE}), sunOrientation);
    vec3 color = texture2D(moonTexture, vUv).rgb;
    color *= mix(float(${MOON_AMBIENT_SCALE}), 1.0, dayMix);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const GLOW_VERTEX_SHADER = `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
    #include <logdepthbuf_vertex>
  }
`;

const GLOW_FRAGMENT_SHADER = `
  #include <logdepthbuf_pars_fragment>
  uniform vec3 glowColor;
  uniform float opacity;
  uniform float falloff;
  uniform vec3 sunDirection;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    #include <logdepthbuf_fragment>
    vec3 normal = normalize(vNormal);
    float facing = dot(normal, normalize(vViewDir));
    float strength = pow(max(facing, 0.0), falloff);
    float sunFacing = dot(normal, normalize(sunDirection));
    float sunMask = smoothstep(-0.1, 0.4, sunFacing);
    gl_FragColor = vec4(glowColor, strength * sunMask * opacity);
  }
`;

function MoonSurfaceMaterial({ texture }: { texture: THREE.Texture }) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        moonTexture: { value: texture },
        sunDirection: { value: SUN_DIRECTION.clone().normalize() },
      },
      vertexShader: SURFACE_VERTEX_SHADER,
      fragmentShader: SURFACE_FRAGMENT_SHADER,
    });
  }, [texture]);

  return <primitive object={material} attach="material" />;
}

function MoonGlow() {
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(GLOW_COLOR) },
        opacity: { value: GLOW_OPACITY },
        falloff: { value: GLOW_FALLOFF },
        sunDirection: { value: SUN_DIRECTION.clone().normalize() },
      },
      vertexShader: GLOW_VERTEX_SHADER,
      fragmentShader: GLOW_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, []);

  const glowRadius = MOON_RADIUS * GLOW_SCALE;

  return (
    <mesh>
      <sphereGeometry
        args={[glowRadius, GLOW_SPHERE_SEGMENTS, GLOW_SPHERE_SEGMENTS]}
      />
      <primitive object={glowMaterial} attach="material" />
    </mesh>
  );
}

export default function Moon() {
  const moonTexture = useLoader(THREE.TextureLoader, MOON_TEXTURE_URL);

  return (
    <group rotation={[INCLINATION_RAD, 0, 0]}>
      <group position={MOON_POSITION}>
        <mesh rotation={[0, MOON_TEXTURE_Y_ROTATION, 0]}>
          <sphereGeometry args={[MOON_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <MoonSurfaceMaterial texture={moonTexture} />
        </mesh>
        <MoonGlow />
      </group>
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
