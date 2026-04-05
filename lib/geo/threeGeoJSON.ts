// Based on https://github.com/bobbyroe/ThreeGeoJSON/tree/three-v170
import type {
  Feature,
  FeatureCollection,
  GeoJSON,
  Geometry,
  GeometryCollection,
  Position,
} from "geojson";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

const INTERPOLATION_THRESHOLD_DEGREES = 5;
const DEGREES_TO_RADIANS = Math.PI / 180;

export type GeoJsonDrawShape = "sphere" | "plane";

export type DrawThreeGeoMaterialOptions = THREE.LineBasicMaterialParameters &
  Partial<THREE.PointsMaterialParameters>;

export type DrawThreeGeoLineStyle = {
  resolution: THREE.Vector2;
  pixelWidth: number;
};

export function drawThreeGeo(
  json: GeoJSON,
  radius: number,
  shape: GeoJsonDrawShape,
  materialOptions: DrawThreeGeoMaterialOptions,
  container: THREE.Object3D,
  lineStyle?: DrawThreeGeoLineStyle
): void {
  const xValues: number[] = [];
  const yValues: number[] = [];
  const zValues: number[] = [];

  const jsonGeom = createGeometryArray(json);
  const convertCoordinates = getConversionFunction(shape);

  for (let geomNum = 0; geomNum < jsonGeom.length; geomNum++) {
    const geom = jsonGeom[geomNum];
    if (geom.type === "Point") {
      convertCoordinates(geom.coordinates, radius, xValues, yValues, zValues);
      drawParticle(
        xValues[0],
        yValues[0],
        zValues[0],
        materialOptions,
        container
      );
      clearArrays(xValues, yValues, zValues);
    } else if (geom.type === "MultiPoint") {
      for (
        let pointNum = 0;
        pointNum < geom.coordinates.length;
        pointNum++
      ) {
        convertCoordinates(
          geom.coordinates[pointNum],
          radius,
          xValues,
          yValues,
          zValues
        );
        drawParticle(
          xValues[0],
          yValues[0],
          zValues[0],
          materialOptions,
          container
        );
        clearArrays(xValues, yValues, zValues);
      }
    } else if (geom.type === "LineString") {
      const coordinateArray = createCoordinateArray(geom.coordinates);
      for (
        let pointNum = 0;
        pointNum < coordinateArray.length;
        pointNum++
      ) {
        convertCoordinates(
          coordinateArray[pointNum],
          radius,
          xValues,
          yValues,
          zValues
        );
      }
      drawLine(xValues, yValues, zValues, materialOptions, container, lineStyle);
      clearArrays(xValues, yValues, zValues);
    } else if (geom.type === "Polygon") {
      for (
        let segmentNum = 0;
        segmentNum < geom.coordinates.length;
        segmentNum++
      ) {
        const coordinateArray = createCoordinateArray(
          geom.coordinates[segmentNum]
        );
        for (
          let pointNum = 0;
          pointNum < coordinateArray.length;
          pointNum++
        ) {
          convertCoordinates(
            coordinateArray[pointNum],
            radius,
            xValues,
            yValues,
            zValues
          );
        }
        drawLine(xValues, yValues, zValues, materialOptions, container, lineStyle);
        clearArrays(xValues, yValues, zValues);
      }
    } else if (geom.type === "MultiLineString") {
      for (
        let segmentNum = 0;
        segmentNum < geom.coordinates.length;
        segmentNum++
      ) {
        const coordinateArray = createCoordinateArray(
          geom.coordinates[segmentNum]
        );
        for (
          let pointNum = 0;
          pointNum < coordinateArray.length;
          pointNum++
        ) {
          convertCoordinates(
            coordinateArray[pointNum],
            radius,
            xValues,
            yValues,
            zValues
          );
        }
        drawLine(xValues, yValues, zValues, materialOptions, container, lineStyle);
        clearArrays(xValues, yValues, zValues);
      }
    } else if (geom.type === "MultiPolygon") {
      for (
        let polygonNum = 0;
        polygonNum < geom.coordinates.length;
        polygonNum++
      ) {
        for (
          let segmentNum = 0;
          segmentNum < geom.coordinates[polygonNum].length;
          segmentNum++
        ) {
          const coordinateArray = createCoordinateArray(
            geom.coordinates[polygonNum][segmentNum]
          );
          for (
            let pointNum = 0;
            pointNum < coordinateArray.length;
            pointNum++
          ) {
            convertCoordinates(
              coordinateArray[pointNum],
              radius,
              xValues,
              yValues,
              zValues
            );
          }
          drawLine(xValues, yValues, zValues, materialOptions, container, lineStyle);
          clearArrays(xValues, yValues, zValues);
        }
      }
    } else {
      throw new Error("The geoJSON is not valid.");
    }
  }
}

function createGeometryArray(json: GeoJSON): Geometry[] {
  if (json.type === "Feature") {
    const geometry = (json as Feature).geometry;
    return geometry === null ? [] : [geometry];
  }
  if (json.type === "FeatureCollection") {
    const collection = json as FeatureCollection;
    return collection.features
      .map((f) => f.geometry)
      .filter((g): g is Geometry => g !== null);
  }
  if (json.type === "GeometryCollection") {
    const collection = json as GeometryCollection;
    return collection.geometries.filter((g): g is Geometry => g !== null);
  }
  throw new Error("The geoJSON is not valid.");
}

function getConversionFunction(shape: GeoJsonDrawShape) {
  if (shape === "sphere") {
    return convertToSphereCoords;
  }
  if (shape === "plane") {
    return convertToPlaneCoords;
  }
  throw new Error("The shape that you specified is not valid.");
}

function createCoordinateArray(feature: Position[]): Position[] {
  const tempArray: Position[] = [];

  for (let pointNum = 0; pointNum < feature.length; pointNum++) {
    const point1 = feature[pointNum];
    const point2 = feature[pointNum - 1];

    if (pointNum > 0) {
      if (needsInterpolation(point2, point1)) {
        const interpolationArrays = interpolatePoints([point2, point1]);
        for (
          let interPointNum = 0;
          interPointNum < interpolationArrays.length;
          interPointNum++
        ) {
          tempArray.push(interpolationArrays[interPointNum]);
        }
      } else {
        tempArray.push(point1);
      }
    } else {
      tempArray.push(point1);
    }
  }
  return tempArray;
}

function needsInterpolation(point2: Position, point1: Position): boolean {
  const lon1 = point1[0];
  const lat1 = point1[1];
  const lon2 = point2[0];
  const lat2 = point2[1];
  const lonDistance = Math.abs(lon1 - lon2);
  const latDistance = Math.abs(lat1 - lat2);

  return (
    lonDistance > INTERPOLATION_THRESHOLD_DEGREES ||
    latDistance > INTERPOLATION_THRESHOLD_DEGREES
  );
}

function interpolatePoints(interpolationArray: Position[]): Position[] {
  const tempArray: Position[] = [];

  for (
    let pointNum = 0;
    pointNum < interpolationArray.length - 1;
    pointNum++
  ) {
    const pt1 = interpolationArray[pointNum];
    const pt2 = interpolationArray[pointNum + 1];

    if (needsInterpolation(pt1, pt2)) {
      tempArray.push(pt1);
      tempArray.push(getMidpoint(pt1, pt2));
    } else {
      tempArray.push(pt1);
    }
  }

  tempArray.push(interpolationArray[interpolationArray.length - 1]);

  if (tempArray.length > interpolationArray.length) {
    return interpolatePoints(tempArray);
  }
  return tempArray;
}

function getMidpoint(point1: Position, point2: Position): Position {
  const midpointLon = (point1[0] + point2[0]) / 2;
  const midpointLat = (point1[1] + point2[1]) / 2;
  return [midpointLon, midpointLat];
}

function convertToSphereCoords(
  coordinatesArray: Position,
  sphereRadius: number,
  xValues: number[],
  yValues: number[],
  zValues: number[]
) {
  const lonRad = coordinatesArray[0] * DEGREES_TO_RADIANS;
  const latRad = coordinatesArray[1] * DEGREES_TO_RADIANS;
  const cosLat = Math.cos(latRad);

  xValues.push(-sphereRadius * cosLat * Math.cos(lonRad));
  yValues.push(sphereRadius * Math.sin(latRad));
  zValues.push(sphereRadius * cosLat * Math.sin(lonRad));
}

function convertToPlaneCoords(
  coordinatesArray: Position,
  planeRadius: number,
  xValues: number[],
  yValues: number[],
  zValues: number[]
) {
  const lon = coordinatesArray[0];
  const lat = coordinatesArray[1];

  zValues.push((lat / 180) * planeRadius);
  yValues.push((lon / 180) * planeRadius);
  xValues.push(0);
}

function drawParticle(
  x: number,
  y: number,
  z: number,
  options: DrawThreeGeoMaterialOptions,
  container: THREE.Object3D
) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([x, y, z], 3));

  const particleMaterial = new THREE.PointsMaterial(options);

  const particle = new THREE.Points(geo, particleMaterial);
  container.add(particle);
}

function drawLine(
  xs: number[],
  ys: number[],
  zs: number[],
  options: DrawThreeGeoMaterialOptions,
  container: THREE.Object3D,
  lineStyle?: DrawThreeGeoLineStyle
) {
  const verts: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    verts.push(xs[i], ys[i], zs[i]);
  }

  if (lineStyle) {
    const geometry = new LineGeometry();
    geometry.setPositions(verts);
    const color =
      options.color !== undefined
        ? new THREE.Color(options.color as THREE.ColorRepresentation)
        : new THREE.Color(0xffffff);
    const material = new LineMaterial({
      color: color.getHex(),
      linewidth: lineStyle.pixelWidth,
      worldUnits: false,
      resolution: lineStyle.resolution,
    });
    const line = new Line2(geometry, material);
    line.computeLineDistances();
    container.add(line);
    return;
  }

  const lineGeom = new THREE.BufferGeometry();
  createVertexForEachPoint(lineGeom, xs, ys, zs);

  const lineMaterial = new THREE.LineBasicMaterial(options);
  const line = new THREE.Line(lineGeom, lineMaterial);
  container.add(line);
}

function createVertexForEachPoint(
  objectGeometry: THREE.BufferGeometry,
  valuesAxis1: number[],
  valuesAxis2: number[],
  valuesAxis3: number[]
) {
  const verts: number[] = [];
  for (let i = 0; i < valuesAxis1.length; i++) {
    verts.push(valuesAxis1[i], valuesAxis2[i], valuesAxis3[i]);
  }
  objectGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(verts, 3)
  );
}

function clearArrays(
  xValues: number[],
  yValues: number[],
  zValues: number[]
) {
  xValues.length = 0;
  yValues.length = 0;
  zValues.length = 0;
}
