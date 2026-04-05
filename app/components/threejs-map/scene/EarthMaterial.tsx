"use client";

import * as THREE from "three";
import { useLoader, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";

const TEXTURE_URLS = [
  "/threejs-map/textures/earth-daymap-4k.jpg",
  "/threejs-map/textures/earth-clouds-4k.jpg",
] as const;

const AMBIENT_SURFACE_SCALE = 0.68;
const TERMINATOR_SHADOW_EDGE = -0.52;
const TERMINATOR_DAY_EDGE = 0.52;

const EARTH_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;

      vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

      vUv = uv;
      vNormal = modelNormal;
    }
  `;

const EARTH_FRAGMENT_SHADER = `
    uniform sampler2D dayTexture;
    uniform sampler2D cloudsTexture;
    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 color = vec3(0.0);

      float sunOrientation = dot(sunDirection, normal);

      float dayMix = smoothstep(float(${TERMINATOR_SHADOW_EDGE}), float(${TERMINATOR_DAY_EDGE}), sunOrientation);
      vec3 dayColor = texture(dayTexture, vUv).rgb;
      color = dayColor * mix(float(${AMBIENT_SURFACE_SCALE}), 1.0, dayMix);

      vec3 cloudsPacked = texture(cloudsTexture, vUv).rgb;

      float cloudsMix = smoothstep(0.0, 1.0, cloudsPacked.b);
      cloudsMix *= dayMix;
      color = mix(color, vec3(1.0), cloudsMix);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

type EarthMaterialProps = {
  sunDirection: THREE.Vector3;
};

export default function EarthMaterial({ sunDirection }: EarthMaterialProps) {
  const [dayTexture, cloudsTexture] = useLoader(
    THREE.TextureLoader,
    [...TEXTURE_URLS],
  );
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    const textures = [dayTexture, cloudsTexture];
    for (const texture of textures) {
      texture.anisotropy = maxAnisotropy;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
  }, [gl, dayTexture, cloudsTexture]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        cloudsTexture: { value: cloudsTexture },
        sunDirection: { value: sunDirection.clone() },
      },
      vertexShader: EARTH_VERTEX_SHADER,
      fragmentShader: EARTH_FRAGMENT_SHADER,
    });
  }, [dayTexture, cloudsTexture, sunDirection]);

  return <primitive object={material} attach="material" />;
}
