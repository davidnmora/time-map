"use client";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { EARTH_TEXTURE_URLS } from "./constants";

const EARTH_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;

      vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

      vUv = uv;
      vNormal = modelNormal;
      vPosition = modelPosition.xyz;
    }
  `;

const EARTH_FRAGMENT_SHADER = `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D cloudsTexture;
    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDirection = normalize(vPosition - cameraPosition);
      vec3 normal = normalize(vNormal);
      vec3 color = vec3(0.0);

      float sunOrientation = dot(sunDirection, normal);

      float dayMix = smoothstep(- 0.25, 0.5, sunOrientation);
      vec3 dayColor = texture(dayTexture, vUv).rgb;
      vec3 nightColor = texture(nightTexture, vUv).rgb;
      color = mix(nightColor, dayColor, dayMix);

      vec2 specularCloudsColor = texture(cloudsTexture, vUv).rg;

      float cloudsMix = smoothstep(0.0, 1.0, specularCloudsColor.g);
      cloudsMix *= dayMix;
      color = mix(color, vec3(1.0), cloudsMix);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

type EarthMaterialProps = {
  sunDirection: THREE.Vector3;
};

export default function EarthMaterial({ sunDirection }: EarthMaterialProps) {
  const [dayTexture, nightTexture, cloudsTexture] = useLoader(
    THREE.TextureLoader,
    [...EARTH_TEXTURE_URLS],
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        cloudsTexture: { value: cloudsTexture },
        sunDirection: { value: sunDirection.clone() },
      },
      vertexShader: EARTH_VERTEX_SHADER,
      fragmentShader: EARTH_FRAGMENT_SHADER,
    });
  }, [dayTexture, nightTexture, cloudsTexture, sunDirection]);

  return <primitive object={material} attach="material" />;
}
