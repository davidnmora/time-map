"use client";

import * as THREE from "three";
import { useMemo } from "react";
import {
  SUN_COLOR,
  SUN_DIRECTION,
  SUN_DISTANCE,
  SUN_EMISSIVE_INTENSITY,
  SUN_GLOW_FALLOFF,
  SUN_GLOW_OPACITY,
  SUN_GLOW_SCALE,
  SUN_RADIUS,
} from "./constants";

const SUN_POSITION = SUN_DIRECTION
  .clone()
  .normalize()
  .multiplyScalar(SUN_DISTANCE);

const GLOW_SPHERE_SEGMENTS = 48;

const GLOW_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const GLOW_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  uniform float opacity;
  uniform float falloff;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float facing = dot(normalize(vNormal), normalize(vViewDir));
    float strength = pow(max(facing, 0.0), falloff);
    gl_FragColor = vec4(glowColor, strength * opacity);
  }
`;

function SunGlow() {
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: {
          value: new THREE.Color(SUN_COLOR).multiplyScalar(
            SUN_EMISSIVE_INTENSITY,
          ),
        },
        opacity: { value: SUN_GLOW_OPACITY },
        falloff: { value: SUN_GLOW_FALLOFF },
      },
      vertexShader: GLOW_VERTEX_SHADER,
      fragmentShader: GLOW_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, []);

  const glowRadius = SUN_RADIUS * SUN_GLOW_SCALE;

  return (
    <mesh>
      <sphereGeometry
        args={[glowRadius, GLOW_SPHERE_SEGMENTS, GLOW_SPHERE_SEGMENTS]}
      />
      <primitive object={glowMaterial} attach="material" />
    </mesh>
  );
}

export default function Sun() {
  return (
    <group position={SUN_POSITION.toArray()}>
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(SUN_COLOR).multiplyScalar(
            SUN_EMISSIVE_INTENSITY,
          )}
        />
      </mesh>
      <SunGlow />
    </group>
  );
}
