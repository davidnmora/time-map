"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { GeoJSON } from "geojson";
import { updateGeographicRegions } from "./map-utils";
import type { Metadata, TimeRange } from "../../data/types";

export type GeographicRegion = {
  id: string;
  data: GeoJSON.Feature | GeoJSON.FeatureCollection;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
  metadata?: Metadata;
  timeRange?: TimeRange;
  hierarchy?: string[];
};

export type TooltipData = {
  hierarchy: string[];
  title: string;
  description?: string;
  timeRange: TimeRange;
};

type MapProps = {
  center: [number, number];
  zoom: number;
  style: string;
  accessToken: string;
  onPositionUpdated: (center: [number, number], zoom: number) => void;
  geographicRegions?: GeographicRegion[];
  renderTooltip?: (data: TooltipData) => string;
};

export default function Map(props: MapProps) {
  if (!props) {
    return null;
  }

  const {
    center,
    zoom,
    style,
    accessToken,
    onPositionUpdated,
    geographicRegions = [],
    renderTooltip,
  } = props;
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const sourcesRef = useRef<Set<string>>(new Set());
  const isUserInteractionRef = useRef(false);
  const onPositionUpdatedRef = useRef(onPositionUpdated);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredRegionIdRef = useRef<string | null>(null);
  const hoveredFeatureRef = useRef<{
    sourceId: string;
    featureId: string | number;
  } | null>(null);
  const regionDataMapRef = useRef<globalThis.Map<string, GeographicRegion>>(
    new globalThis.Map()
  );
  const hoverHandlersRef = useRef<
    globalThis.Map<string, { mousemove: () => void; mouseleave: () => void }>
  >(new globalThis.Map());

  // Keep the callback ref up to date
  useEffect(() => {
    onPositionUpdatedRef.current = onPositionUpdated;
  }, [onPositionUpdated]);

  // Initialize map
  useEffect(() => {
    if (!accessToken || !center || !zoom || !style) {
      return;
    }

    mapboxgl.accessToken = accessToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLElement,
      center,
      zoom,
      style,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -20],
    });

    // Set up position update listeners
    const handleMoveEnd = () => {
      if (!mapRef.current || !isUserInteractionRef.current) return;
      const newCenter = mapRef.current.getCenter();
      const newZoom = mapRef.current.getZoom();
      onPositionUpdatedRef.current([newCenter.lng, newCenter.lat], newZoom);
      isUserInteractionRef.current = false;
    };

    mapRef.current.on("moveend", handleMoveEnd);
    mapRef.current.on("zoomend", handleMoveEnd);

    // Track user interactions
    mapRef.current.on("movestart", () => {
      isUserInteractionRef.current = true;
    });
    mapRef.current.on("zoomstart", () => {
      isUserInteractionRef.current = true;
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once

  // Update center and zoom with smooth transitions
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if we need to update
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    const centerChanged =
      Math.abs(currentCenter.lng - center[0]) > 0.0001 ||
      Math.abs(currentCenter.lat - center[1]) > 0.0001;
    const zoomChanged = Math.abs(currentZoom - zoom) > 0.01;

    if (centerChanged || zoomChanged) {
      // Only transition if the change is significant (not from user interaction)
      if (!isUserInteractionRef.current) {
        mapRef.current.easeTo({
          center,
          zoom,
          duration: 500,
        });
      }
    }
  }, [center, zoom]);

  // Build region data map for tooltip lookups
  useEffect(() => {
    regionDataMapRef.current.clear();
    geographicRegions.forEach((region) => {
      regionDataMapRef.current.set(region.id, region);
    });
  }, [geographicRegions]);

  // Handle geographic regions - add/remove sources and layers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const cleanupHoverHandlers = () => {
      hoverHandlersRef.current.forEach((handlers, layerId) => {
        map.off("mousemove", layerId, handlers.mousemove);
        map.off("mouseleave", layerId, handlers.mouseleave);
      });
      hoverHandlersRef.current.clear();
    };

    // Wait for map to be ready
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => {
        if (mapRef.current) {
          cleanupHoverHandlers();
          updateGeographicRegions(
            mapRef.current,
            sourcesRef,
            geographicRegions
          );
          setupHoverHandlers(mapRef.current, geographicRegions);
        }
      });
      return;
    }

    cleanupHoverHandlers();
    updateGeographicRegions(map, sourcesRef, geographicRegions);
    setupHoverHandlers(map, geographicRegions);

    return () => {
      cleanupHoverHandlers();
    };
  }, [geographicRegions, renderTooltip]);

  const setupHoverHandlers = (
    map: mapboxgl.Map,
    regions: GeographicRegion[]
  ) => {
    if (!renderTooltip) return;

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
      popupRef.current?.remove();
    };

    regions.forEach((region) => {
      const fillLayerId = `${region.id}-fill`;

      if (!map.getLayer(fillLayerId)) return;

      const handleMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
        if (!renderTooltip || !e.features || e.features.length === 0) return;

        const regionData = regionDataMapRef.current.get(region.id);
        if (!regionData) return;

        if (hoveredRegionIdRef.current !== region.id) {
          removeHoverState();
        }

        hoveredRegionIdRef.current = region.id;

        const feature = e.features[0];
        const featureId = feature.id ?? 0;

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

        const hierarchy = regionData.hierarchy || [];
        const title = regionData.metadata?.title || "";
        const description = regionData.metadata?.description;
        const timeRange = regionData.timeRange || [0, null];

        const tooltipHtml = renderTooltip({
          hierarchy,
          title,
          description,
          timeRange,
        });

        popupRef.current?.setLngLat(e.lngLat).setHTML(tooltipHtml).addTo(map);
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
  };

  return (
    <div id="map-container" ref={mapContainerRef} className="h-full w-full" />
  );
}

