import type React from "react";
import mapboxgl from "mapbox-gl";
import type { GeographicRegion } from "./Map";
import type { TimeRange } from "../../data/types";

const DEFAULT_FILL_OPACITY = 0.2;
const DEFAULT_LINE_WIDTH = 1;

export type TooltipData = {
  hierarchy: string[];
  title: string;
  description?: string;
  timeRange: TimeRange;
};

export const formatTimeRange = (timeRange: TimeRange): string => {
  const [start, end] = timeRange;
  if (end === null) {
    return `${start} - present`;
  }
  return `${start} - ${end}`;
};

export const renderTooltip = (data: TooltipData): string => {
  const hierarchyText =
    data.hierarchy.length > 0 ? data.hierarchy.join(" > ") : "";
  const timeRangeText = formatTimeRange(data.timeRange);

  let html = "";
  if (hierarchyText) {
    html += `<div style="font-weight: 600; margin-bottom: 4px;">${hierarchyText}</div>`;
  }
  html += `<div style="font-weight: 600; margin-bottom: 4px;">${data.title}</div>`;
  if (data.description) {
    html += `<div style="margin-bottom: 4px; color: #666;">${data.description}</div>`;
  }
  html += `<div style="color: #666;">${timeRangeText}</div>`;
  return html;
};

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
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(region.data);
    } else {
      map.addSource(sourceId, {
        type: "geojson",
        data: region.data,
        generateId: true,
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
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            region.fillOpacity ?? DEFAULT_FILL_OPACITY,
          ],
        },
      });
    } else {
      map.setPaintProperty(
        fillLayerId,
        "fill-color",
        region.fillColor || "#0080ff"
      );
      map.setPaintProperty(fillLayerId, "fill-opacity", [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1,
        region.fillOpacity ?? DEFAULT_FILL_OPACITY,
      ] as any);
    }

    if (!map.getLayer(lineLayerId)) {
      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": region.lineColor || "#000",
          "line-width": region.lineWidth ?? DEFAULT_LINE_WIDTH,
        },
      });
    } else {
      map.setPaintProperty(
        lineLayerId,
        "line-color",
        region.lineColor || "#000"
      );
      map.setPaintProperty(lineLayerId, "line-width", region.lineWidth ?? DEFAULT_LINE_WIDTH);
    }
  });
}

