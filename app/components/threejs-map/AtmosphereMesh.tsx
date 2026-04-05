import * as THREE from "three";
import {
  ATMOSPHERE_FACING_COLOR,
  ATMOSPHERE_FRESNEL_BIAS,
  ATMOSPHERE_FRESNEL_POWER,
  ATMOSPHERE_FRESNEL_SCALE,
  ATMOSPHERE_ICOSAHEDRON_DETAIL,
  ATMOSPHERE_ICOSAHEDRON_RADIUS,
  ATMOSPHERE_RIM_COLOR,
} from "./constants";

const ATMOSPHERE_VERTEX_SHADER = `
  uniform float fresnelBias;
  uniform float fresnelScale;
  uniform float fresnelPower;

  varying float vReflectionFactor;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

    vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

    vec3 I = worldPosition.xyz - cameraPosition;

    vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );

    gl_Position = projectionMatrix * mvPosition;
  }
  `;

const ATMOSPHERE_FRAGMENT_SHADER = `
  uniform vec3 color1;
  uniform vec3 color2;

  varying float vReflectionFactor;

  void main() {
    float f = clamp( vReflectionFactor, 0.0, 1.0 );
    gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
  }
  `;

type AtmosphereMeshProps = {
  rimHex?: number;
  facingHex?: number;
};

export default function AtmosphereMesh({
  rimHex = ATMOSPHERE_RIM_COLOR,
  facingHex = ATMOSPHERE_FACING_COLOR,
}: AtmosphereMeshProps) {
  const uniforms = {
    color1: { value: new THREE.Color(rimHex) },
    color2: { value: new THREE.Color(facingHex) },
    fresnelBias: { value: ATMOSPHERE_FRESNEL_BIAS },
    fresnelScale: { value: ATMOSPHERE_FRESNEL_SCALE },
    fresnelPower: { value: ATMOSPHERE_FRESNEL_POWER },
  };

  return (
    <mesh>
      <icosahedronGeometry
        args={[ATMOSPHERE_ICOSAHEDRON_RADIUS, ATMOSPHERE_ICOSAHEDRON_DETAIL]}
      />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={ATMOSPHERE_VERTEX_SHADER}
        fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
