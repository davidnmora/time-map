import * as THREE from "three";

export const SUN_DIRECTION = new THREE.Vector3(-2, 0.5, 1.5);

export const EARTH_ICOSAHEDRON_RADIUS = 2;
export const EARTH_ICOSAHEDRON_DETAIL = 64;
export const EARTH_AXIAL_TILT_DEGREES = 23.4;

export const ORBIT_SURFACE_CLEARANCE = 0.22;
export const ORBIT_MIN_DISTANCE_FROM_CENTER =
  EARTH_ICOSAHEDRON_RADIUS + ORBIT_SURFACE_CLEARANCE;
export const ORBIT_MAX_DISTANCE = 96;
export const ORBIT_DAMPING_FACTOR = 0.06;
export const ORBIT_TARGET: [number, number, number] = [0, 0, 0];
export const ORBIT_ZOOM_SPEED_NEAR = 0.16;
export const ORBIT_ZOOM_SPEED_FAR = 0.68;
export const ORBIT_ZOOM_SPEED_CURVE_EXPONENT = 2.35;
export const ORBIT_ROTATE_SPEED_NEAR = 0.085;
export const ORBIT_ROTATE_SPEED_FAR = 3;
export const ORBIT_ROTATE_RESPONSE_SHARPNESS = 3.4;

export const CANVAS_TONE_MAPPING = THREE.NoToneMapping;
export const MAX_DEVICE_PIXEL_RATIO = 3;

export const GEOJSON_OVERLAY_LINE_COLOR = 0x000000;
export const GEOJSON_OVERLAY_LINE_WIDTH_PX = 2.5;
