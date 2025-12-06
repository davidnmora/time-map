import type React from "react";
import mapboxgl from "mapbox-gl";
import type { GeographicRegion } from "./Map";
import type {
  TimeRange,
  TimeBoundGeographicRegionGroup,
} from "../../data/types";
import { getAllRegions } from "../../utils/data";

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

export function convertAllToMapRegions(
  group: TimeBoundGeographicRegionGroup
): GeographicRegion[] {
  const regionsWithHierarchy = getAllRegions(group);
  return regionsWithHierarchy.flatMap(({ region, hierarchy }) =>
    region.geographicRegions.map((geoRegion, index) => ({
      id: `${region.metadata.id}-${index}`,
      data: geoRegion,
      fillColor: region.metadata.color,
      fillOpacity: 0.5,
      lineColor: "#000",
      lineWidth: 2,
      metadata: region.metadata,
      timeRange: region.timeRange,
      hierarchy: [...hierarchy, region.metadata.title],
    }))
  );
}

export function initializeGeographicRegions(
  map: mapboxgl.Map,
  sourcesRef: React.MutableRefObject<Set<string>>,
  geographicRegions: GeographicRegion[]
) {
  if (!map) return;

  geographicRegions.forEach((region) => {
    const sourceId = region.id;
    const fillLayerId = `${sourceId}-fill`;
    const lineLayerId = `${sourceId}-line`;

    if (map.getSource(sourceId)) {
      return;
    }

    map.addSource(sourceId, {
      type: "geojson",
      data: region.data,
      generateId: true,
    });
    sourcesRef.current.add(sourceId);

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
          [
            "case",
            ["boolean", ["feature-state", "visible"], false],
            region.fillOpacity ?? DEFAULT_FILL_OPACITY,
            0,
          ],
        ],
      },
      layout: {},
    });

    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": region.lineColor || "#000",
        "line-width": region.lineWidth ?? DEFAULT_LINE_WIDTH,
        "line-opacity": [
          "case",
          ["boolean", ["feature-state", "visible"], false],
          1,
          0,
        ],
      },
      layout: {},
    });
  });
}

