import * as THREE from "three";
import type { GeoJSON } from "geojson";

const DEGREES_TO_RADIANS = Math.PI / 180;

// These two balance each other: keeping the edge offset higher improves performance by reducing the number of vertices, but increases risk
// that a geometry will not properly "bend" around the earth's curvature, creating holes or other artifacts.
// Lifting the geometries slightly off the earth's surface, we can keep the edge offset low, but still avoid artifacts.
export const FILL_SURFACE_OFFSET = 0.001;
const MAX_EDGE_LENGTH = 0.12;

const DUPLICATE_VERTEX_EPSILON = 1e-10;

function lonLatToSphere(
  lon: number,
  lat: number,
  radius: number,
): [number, number, number] {
  const lonRad = lon * DEGREES_TO_RADIANS;
  const latRad = lat * DEGREES_TO_RADIANS;
  const cosLat = Math.cos(latRad);
  return [
    -radius * cosLat * Math.cos(lonRad),
    radius * Math.sin(latRad),
    radius * cosLat * Math.sin(lonRad),
  ];
}

function edgeLength3D(
  positions: number[],
  i0: number,
  i1: number,
): number {
  const dx = positions[i1 * 3] - positions[i0 * 3];
  const dy = positions[i1 * 3 + 1] - positions[i0 * 3 + 1];
  const dz = positions[i1 * 3 + 2] - positions[i0 * 3 + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function getOrCreateMidpoint(
  positions: number[],
  cache: Map<string, number>,
  i0: number,
  i1: number,
  radius: number,
): number {
  const key = edgeKey(i0, i1);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const mx = (positions[i0 * 3] + positions[i1 * 3]) / 2;
  const my = (positions[i0 * 3 + 1] + positions[i1 * 3 + 1]) / 2;
  const mz = (positions[i0 * 3 + 2] + positions[i1 * 3 + 2]) / 2;

  const len = Math.sqrt(mx * mx + my * my + mz * mz);
  const scale = radius / len;

  const newIndex = positions.length / 3;
  positions.push(mx * scale, my * scale, mz * scale);
  cache.set(key, newIndex);
  return newIndex;
}

function subdivideForSphere(
  inputPositions: number[],
  inputIndices: number[],
  radius: number,
): { positions: number[]; indices: number[] } {
  let currentPositions = [...inputPositions];
  let currentIndices = [...inputIndices];

  const MAX_PASSES = 6;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const splitEdges = new Set<string>();
    const midpointCache = new Map<string, number>();

    for (let i = 0; i < currentIndices.length; i += 3) {
      const i0 = currentIndices[i];
      const i1 = currentIndices[i + 1];
      const i2 = currentIndices[i + 2];

      if (edgeLength3D(currentPositions, i0, i1) > MAX_EDGE_LENGTH)
        splitEdges.add(edgeKey(i0, i1));
      if (edgeLength3D(currentPositions, i1, i2) > MAX_EDGE_LENGTH)
        splitEdges.add(edgeKey(i1, i2));
      if (edgeLength3D(currentPositions, i2, i0) > MAX_EDGE_LENGTH)
        splitEdges.add(edgeKey(i2, i0));
    }

    if (splitEdges.size === 0) break;

    const getMid = (a: number, b: number): number | null => {
      if (!splitEdges.has(edgeKey(a, b))) return null;
      return getOrCreateMidpoint(currentPositions, midpointCache, a, b, radius);
    };

    const newIndices: number[] = [];

    for (let i = 0; i < currentIndices.length; i += 3) {
      const i0 = currentIndices[i];
      const i1 = currentIndices[i + 1];
      const i2 = currentIndices[i + 2];

      const m01 = getMid(i0, i1);
      const m12 = getMid(i1, i2);
      const m20 = getMid(i2, i0);

      const has01 = m01 !== null;
      const has12 = m12 !== null;
      const has20 = m20 !== null;
      const splitCount = +has01 + +has12 + +has20;

      if (splitCount === 0) {
        newIndices.push(i0, i1, i2);
      } else if (splitCount === 3) {
        newIndices.push(i0, m01!, m20!);
        newIndices.push(i1, m12!, m01!);
        newIndices.push(i2, m20!, m12!);
        newIndices.push(m01!, m12!, m20!);
      } else if (splitCount === 1) {
        if (has01) {
          newIndices.push(i0, m01!, i2);
          newIndices.push(m01!, i1, i2);
        } else if (has12) {
          newIndices.push(i1, m12!, i0);
          newIndices.push(m12!, i2, i0);
        } else {
          newIndices.push(i2, m20!, i1);
          newIndices.push(m20!, i0, i1);
        }
      } else {
        if (!has01) {
          newIndices.push(i0, i1, m12!);
          newIndices.push(i0, m12!, m20!);
          newIndices.push(m20!, m12!, i2);
        } else if (!has12) {
          newIndices.push(i1, i2, m20!);
          newIndices.push(i1, m20!, m01!);
          newIndices.push(m01!, m20!, i0);
        } else {
          newIndices.push(i2, i0, m01!);
          newIndices.push(i2, m01!, m12!);
          newIndices.push(m12!, m01!, i1);
        }
      }
    }

    currentIndices = newIndices;
  }

  return { positions: currentPositions, indices: currentIndices };
}

function openRing(ring: number[][]): THREE.Vector2[] {
  const points = ring.map((c) => new THREE.Vector2(c[0], c[1]));

  const last = points[points.length - 1];
  const first = points[0];
  if (
    Math.abs(last.x - first.x) < DUPLICATE_VERTEX_EPSILON &&
    Math.abs(last.y - first.y) < DUPLICATE_VERTEX_EPSILON
  ) {
    return points.slice(0, -1);
  }
  return points;
}

function triangulatePolygonRings(
  rings: number[][][],
  radius: number,
): { positions: number[]; indices: number[] } | null {
  const outerRing = rings[0];
  if (!outerRing || outerRing.length < 4) return null;

  const contour = openRing(outerRing);
  if (contour.length < 3) return null;

  const holeArrays = rings.slice(1).map(openRing);

  let faces: number[][];
  try {
    faces = THREE.ShapeUtils.triangulateShape(contour, holeArrays);
  } catch {
    return null;
  }

  if (faces.length === 0) return null;

  const allVertices2D = [...contour, ...holeArrays.flat()];

  const positions: number[] = [];
  for (const v of allVertices2D) {
    const [x, y, z] = lonLatToSphere(v.x, v.y, radius);
    positions.push(x, y, z);
  }

  const indices: number[] = [];
  for (const face of faces) {
    indices.push(face[0], face[1], face[2]);
  }

  return subdivideForSphere(positions, indices, radius);
}

function extractPolygonRings(
  data: GeoJSON.Feature | GeoJSON.FeatureCollection,
): number[][][][] {
  const allRings: number[][][][] = [];

  const features: GeoJSON.Feature[] =
    data.type === "FeatureCollection"
      ? data.features
      : [data as GeoJSON.Feature];

  for (const feature of features) {
    if (!feature.geometry) continue;

    if (feature.geometry.type === "Polygon") {
      allRings.push(feature.geometry.coordinates);
    } else if (feature.geometry.type === "MultiPolygon") {
      for (const polygon of feature.geometry.coordinates) {
        allRings.push(polygon);
      }
    }
  }

  return allRings;
}

export function createRegionGeometry(
  data: GeoJSON.Feature | GeoJSON.FeatureCollection,
  radius: number,
): THREE.BufferGeometry | null {
  const polygonRingsArray = extractPolygonRings(data);
  if (polygonRingsArray.length === 0) return null;

  const allPositions: number[] = [];
  const allIndices: number[] = [];
  let vertexOffset = 0;

  for (const rings of polygonRingsArray) {
    const result = triangulatePolygonRings(rings, radius);
    if (!result) continue;

    for (const p of result.positions) {
      allPositions.push(p);
    }

    for (const idx of result.indices) {
      allIndices.push(idx + vertexOffset);
    }

    vertexOffset += result.positions.length / 3;
  }

  if (allPositions.length === 0 || allIndices.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(allPositions, 3),
  );
  geometry.setIndex(allIndices);
  geometry.computeVertexNormals();

  return geometry;
}
