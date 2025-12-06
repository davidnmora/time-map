import type React from "react";
import mapboxgl from "mapbox-gl";
import type { GeographicRegion } from "./Map";
import type {
  TimeRange,
  TimeBoundGeographicRegionGroup,
} from "../../data/types";
import { getAFlagListOfAllRegions } from "../../utils/data";

const DEFAULT_FILL_OPACITY = 0.2;
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_COLOR = "#000";
const DEFAULT_FILL_COLOR = "#0080ff";

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
  const regions = getAFlagListOfAllRegions(group);
  return regions.flatMap((region) =>
    region.geographicRegions.map((geoRegion, index) => ({
      id: `${region.metadata.id}-${index}`,
      data: geoRegion,
      fillColor: region.metadata.color,
      fillOpacity: DEFAULT_FILL_OPACITY,
      lineColor: DEFAULT_LINE_COLOR,
      lineWidth: DEFAULT_LINE_WIDTH,
      metadata: region.metadata,
      timeRange: region.timeRange,
      hierarchy: [...region.hierarchy, region.metadata.title],
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
        "fill-color": region.fillColor || DEFAULT_FILL_COLOR,
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
        "line-color": region.lineColor || DEFAULT_LINE_COLOR,
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

export function updateRegionVisibility(
  map: mapboxgl.Map,
  geographicRegions: GeographicRegion[],
  isRegionVisible: (region: GeographicRegion) => boolean
) {
  if (!map) return;

  geographicRegions.forEach((region) => {
    const sourceId = region.id;
    const source = map.getSource(sourceId);
    if (!source || source.type !== "geojson") return;

    const visible = isRegionVisible(region);

    try {
      const features = map.querySourceFeatures(sourceId);
      if (!features || features.length === 0) return;
      features.forEach((feature) => {
        if (feature.id !== undefined && feature.id !== null) {
          try {
            map.setFeatureState(
              { source: sourceId, id: feature.id },
              { visible }
            );
          } catch (e) {
            // Feature might not exist, ignore
          }
        }
      });
    } catch (e) {
      // Source might not be ready, ignore
    }
  });
}

export function initializeMapRegions(
  map: mapboxgl.Map,
  sourcesRef: React.MutableRefObject<Set<string>>,
  geographicRegions: GeographicRegion[],
  setupHoverHandlersFn: (
    map: mapboxgl.Map,
    regions: GeographicRegion[]
  ) => void,
  isRegionVisible: (region: GeographicRegion) => boolean
) {
  if (!map) return;

  initializeGeographicRegions(map, sourcesRef, geographicRegions);
  setupHoverHandlersFn(map, geographicRegions);

  const handleIdle = () => {
    updateRegionVisibility(map, geographicRegions, isRegionVisible);
    map.off("idle", handleIdle);
  };

  map.once("idle", handleIdle);
}

export function updateHoverStateFromContext(
  map: mapboxgl.Map,
  geographicRegions: GeographicRegion[],
  contextHoveredRegionId: string | null
) {
  if (!map) return;

  const matchingRegionIds = contextHoveredRegionId
    ? geographicRegions
        .filter(
          (region) =>
            region.id === contextHoveredRegionId ||
            region.id.startsWith(`${contextHoveredRegionId}-`)
        )
        .map((region) => region.id)
    : [];

  const allRegionIds = geographicRegions.map((region) => region.id);

  allRegionIds.forEach((regionId) => {
    const source = map.getSource(regionId);
    if (!source || source.type !== "geojson") return;

    const isMatchingRegion = matchingRegionIds.includes(regionId);

    try {
      const features = map.querySourceFeatures(regionId);
      features.forEach((feature) => {
        if (feature.id !== undefined && feature.id !== null) {
          try {
            map.setFeatureState(
              { source: regionId, id: feature.id },
              { hover: isMatchingRegion }
            );
          } catch (e) {
            // Feature might not exist, ignore
          }
        }
      });
    } catch (e) {
      // Source might not be ready, ignore
    }
  });
}

export type HoverHandlers = {
  hoveredFeatureRef: React.MutableRefObject<{
    sourceId: string;
    featureId: string | number;
  } | null>;
  hoveredRegionIdRef: React.MutableRefObject<string | null>;
  setHoveredRegionId: (id: string | null) => void;
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>;
  renderTooltip?: (data: TooltipData) => string;
  hoverHandlersRef: React.MutableRefObject<
    globalThis.Map<string, { mousemove: () => void; mouseleave: () => void }>
  >;
};

export function setupHoverHandlers(
  map: mapboxgl.Map,
  regions: GeographicRegion[],
  handlers: HoverHandlers
) {
  const {
    hoveredFeatureRef,
    hoveredRegionIdRef,
    setHoveredRegionId,
    popupRef,
    renderTooltip,
    hoverHandlersRef,
  } = handlers;

  const removeHoverState = () => {
    if (hoveredFeatureRef.current) {
      try {
        map.setFeatureState(
          {
            source: hoveredFeatureRef.current.sourceId,
            id: hoveredFeatureRef.current.featureId,
          },
          { hover: false }
        );
      } catch (e) {
        // Feature might not exist, ignore
      }
      hoveredFeatureRef.current = null;
    }
    hoveredRegionIdRef.current = null;
    setHoveredRegionId(null);
    if (renderTooltip) {
      popupRef.current?.remove();
    }
  };

  regions.forEach((region) => {
    const fillLayerId = `${region.id}-fill`;

    if (!map.getLayer(fillLayerId)) return;

    const handleMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return;

      if (hoveredRegionIdRef.current !== region.id) {
        removeHoverState();
      }

      hoveredRegionIdRef.current = region.id;

      const baseRegionId = region.metadata?.id;
      if (baseRegionId) {
        setHoveredRegionId(baseRegionId);
      }

      const feature = e.features[0];
      const featureId = feature.id;

      if (featureId === undefined || featureId === null) {
        return;
      }

      try {
        map.setFeatureState(
          { source: region.id, id: featureId },
          { hover: true }
        );
        hoveredFeatureRef.current = {
          sourceId: region.id,
          featureId: featureId,
        };
      } catch (e) {
        // Feature might not exist, ignore
      }

      if (renderTooltip) {
        const hierarchy = region.hierarchy || [];
        const title = region.metadata?.title || "";
        const description = region.metadata?.description;
        const timeRange = region.timeRange || [0, null];

        const tooltipHtml = renderTooltip({
          hierarchy,
          title,
          description,
          timeRange,
        });

        popupRef.current?.setLngLat(e.lngLat).setHTML(tooltipHtml).addTo(map);
      }
    };

    const handleMouseLeave = () => {
      removeHoverState();
    };

    map.on("mousemove", fillLayerId, handleMouseMove);
    map.on("mouseleave", fillLayerId, handleMouseLeave);

    hoverHandlersRef.current.set(fillLayerId, {
      mousemove: handleMouseMove as () => void,
      mouseleave: handleMouseLeave,
    });
  });
}

