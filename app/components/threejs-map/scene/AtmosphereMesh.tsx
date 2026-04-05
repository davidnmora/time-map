import * as THREE from "three";

const RIM_COLOR = 0x0088ff;
const FACING_COLOR = 0x000000;
const FRESNEL_BIAS = 0.1;
const FRESNEL_SCALE = 1.0;
const FRESNEL_POWER = 4.0;
const ICOSAHEDRON_RADIUS = 2.03;
const ICOSAHEDRON_DETAIL = 32;

const ATMOSPHERE_VERTEX_SHADER = `
  #include <common>
  #include <logdepthbuf_pars_vertex>
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
    #include <logdepthbuf_vertex>
  }
  `;

const ATMOSPHERE_FRAGMENT_SHADER = `
  #include <logdepthbuf_pars_fragment>
  uniform vec3 color1;
  uniform vec3 color2;

  varying float vReflectionFactor;

  void main() {
    #include <logdepthbuf_fragment>
    float f = clamp( vReflectionFactor, 0.0, 1.0 );
    gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
  }
  `;

type AtmosphereMeshProps = {
  rimHex?: number;
  facingHex?: number;
};

export default function AtmosphereMesh({
  rimHex = RIM_COLOR,
  facingHex = FACING_COLOR,
}: AtmosphereMeshProps) {
  const uniforms = {
    color1: { value: new THREE.Color(rimHex) },
    color2: { value: new THREE.Color(facingHex) },
    fresnelBias: { value: FRESNEL_BIAS },
    fresnelScale: { value: FRESNEL_SCALE },
    fresnelPower: { value: FRESNEL_POWER },
  };

  return (
    <mesh>
      <icosahedronGeometry args={[ICOSAHEDRON_RADIUS, ICOSAHEDRON_DETAIL]} />
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
