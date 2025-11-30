import type React from "react";
import mapboxgl from "mapbox-gl";
import type { GeographicRegion } from "./Map";

export function updateGeographicRegions(
  map: mapboxgl.Map,
  sourcesRef: React.MutableRefObject<Set<string>>,
  geographicRegions: GeographicRegion[]
) {
  if (!map) return;

  const currentRegionIds = new Set(geographicRegions.map((r) => r.id));

  sourcesRef.current.forEach((sourceId) => {
    if (!currentRegionIds.has(sourceId)) {
      const fillLayerId = `${sourceId}-fill`;
      const lineLayerId = `${sourceId}-line`;

      if (map.getLayer(fillLayerId)) {
        map.removeLayer(fillLayerId);
      }
      if (map.getLayer(lineLayerId)) {
        map.removeLayer(lineLayerId);
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      sourcesRef.current.delete(sourceId);
    }
  });

  geographicRegions.forEach((region) => {
    const sourceId = region.id;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(
        region.data
      );
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: region.data,
      });
      sourcesRef.current.add(sourceId);
    }

    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": region.fillColor || "#0080ff",
          "fill-opacity": region.fillOpacity ?? 0.5,
        },
      });
    } else {
      map.setPaintProperty(
        fillLayerId,
        "fill-color",
        region.fillColor || "#0080ff"
      );
      map.setPaintProperty(
        fillLayerId,
        "fill-opacity",
        region.fillOpacity ?? 0.5
      );
    }

    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": region.lineColor || "#000",
          "line-width": region.lineWidth ?? 2,
        },
      });
    } else {
      map.setPaintProperty(
        lineLayerId,
        "line-color",
        region.lineColor || "#000"
      );
      map.setPaintProperty(
        lineLayerId,
        "line-width",
        region.lineWidth ?? 2
      );
    }
  });
}

