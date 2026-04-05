import * as THREE from "three";

export const THREEJS_MAP_ASSET_BASE = "/threejs-map";

export const EARTH_ICOSAHEDRON_RADIUS = 2;
export const EARTH_ICOSAHEDRON_DETAIL = 64;
export const ATMOSPHERE_ICOSAHEDRON_RADIUS = 2.03;
export const ATMOSPHERE_ICOSAHEDRON_DETAIL = 32;

export const SUN_DIRECTION = new THREE.Vector3(-2, 0.5, 1.5);

export const CAMERA_INITIAL_POSITION: [number, number, number] = [0, 0.1, 5];

export const HEMISPHERE_LIGHT_SKY_COLOR = 0xffffff;
export const HEMISPHERE_LIGHT_GROUND_COLOR = 0x000000;
export const HEMISPHERE_LIGHT_INTENSITY = 3.0;

export const CANVAS_TONE_MAPPING = THREE.NoToneMapping;

export const CANVAS_DPR_MIN = 1;
export const CANVAS_DPR_MAX = 3;

export const EARTH_AXIAL_TILT_DEGREES = 23.4;

export const EARTH_TEXTURE_URLS = [
  `${THREEJS_MAP_ASSET_BASE}/textures/earth-daymap-4k.jpg`,
  `${THREEJS_MAP_ASSET_BASE}/textures/earth-nightmap-4k.jpg`,
  `${THREEJS_MAP_ASSET_BASE}/textures/earth-clouds-4k.jpg`,
] as const;

export const STARFIELD_CIRCLE_TEXTURE_URL = `${THREEJS_MAP_ASSET_BASE}/circle.png`;
export const STARFIELD_POINT_SIZE = 0.2;
export const STARFIELD_STAR_COUNT = 3000;
export const STARFIELD_HSL_HUE = 0.6;
export const STARFIELD_HSL_SATURATION = 0.2;
export const STARFIELD_MIN_RADIUS = 25;
export const STARFIELD_RADIUS_SPREAD = 25;

export const NEBULA_SPRITE_COUNT = 8;
export const NEBULA_SPRITE_RADIUS = 10;
export const NEBULA_SPRITE_Z = -10.5;
export const NEBULA_SPRITE_BASE_SIZE = 24;
export const NEBULA_SPRITE_OPACITY = 0.2;
export const NEBULA_HUE = 0.65;
export const NEBULA_SATURATION = 0.5;
export const NEBULA_LIGHTNESS_JITTER = 0.1;

export const RADIAL_GRADIENT_TEXTURE_SIZE = 256;

export const ATMOSPHERE_RIM_COLOR = 0x0088ff;
export const ATMOSPHERE_FACING_COLOR = 0x000000;
export const ATMOSPHERE_FRESNEL_BIAS = 0.1;
export const ATMOSPHERE_FRESNEL_SCALE = 1.0;
export const ATMOSPHERE_FRESNEL_POWER = 4.0;
