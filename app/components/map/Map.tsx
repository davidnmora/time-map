"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { GeoJSON } from "geojson";
import { initializeGeographicRegions, type TooltipData } from "./map-utils";
import type { Metadata, TimeRange } from "../../data/types";
import { useHoveredElement } from "../../contexts/HoveredElementContext";
import { useAppState } from "../../contexts/AppStateContext";
import { isTimeRangeActive } from "../../utils/data";

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

type MapProps = {
  center: [number, number];
  zoom: number;
  style: string;
  accessToken: string;
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
    geographicRegions = [],
    renderTooltip,
  } = props;
  const { updateState, year, minYear, maxYear } = useAppState();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const sourcesRef = useRef<Set<string>>(new Set());
  const isUserInteractionRef = useRef(false);
  const updateStateRef = useRef(updateState);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredRegionIdRef = useRef<string | null>(null);
  const hoveredFeatureRef = useRef<{
    sourceId: string;
    featureId: string | number;
  } | null>(null);
  const hoverHandlersRef = useRef<
    globalThis.Map<string, { mousemove: () => void; mouseleave: () => void }>
  >(new globalThis.Map());
  const { hoveredRegionId: contextHoveredRegionId, setHoveredRegionId } =
    useHoveredElement();

  useEffect(() => {
    updateStateRef.current = updateState;
  }, [updateState]);

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
      updateStateRef.current({
        center: [newCenter.lng, newCenter.lat],
        zoom: newZoom,
      });
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

  const initializedRef = useRef(false);

  const isRegionVisible = (region: GeographicRegion): boolean => {
    return isTimeRangeActive(region.timeRange, year, minYear, maxYear);
  };

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    const map = mapRef.current;

    const initialize = () => {
      if (!mapRef.current) return;
      initializeGeographicRegions(
        mapRef.current,
        sourcesRef,
        geographicRegions
      );
      setupHoverHandlers(mapRef.current, geographicRegions);
      initializedRef.current = true;

      const updateVisibility = () => {
        if (!mapRef.current) return;
        geographicRegions.forEach((region) => {
          const sourceId = region.id;
          const source = mapRef.current?.getSource(sourceId);
          if (!source || source.type !== "geojson") return;

          const visible = isRegionVisible(region);

          try {
            const features = mapRef.current?.querySourceFeatures(sourceId);
            if (!features) return;
            features.forEach((feature) => {
              if (feature.id !== undefined && feature.id !== null) {
                try {
                  mapRef.current?.setFeatureState(
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
      };

      const handleIdle = () => {
        updateVisibility();
        map.off("idle", handleIdle);
      };

      map.once("idle", handleIdle);
    };

    if (!map.isStyleLoaded()) {
      map.once("styledata", initialize);
      return;
    }

    initialize();
  }, [geographicRegions, renderTooltip, year, minYear, maxYear]);

  useEffect(() => {
    if (
      !mapRef.current ||
      !mapRef.current.isStyleLoaded() ||
      !initializedRef.current
    )
      return;

    const map = mapRef.current;

    const updateVisibility = () => {
      if (!mapRef.current) return;
      geographicRegions.forEach((region) => {
        const sourceId = region.id;
        const source = mapRef.current?.getSource(sourceId);
        if (!source || source.type !== "geojson") return;

        const visible = isRegionVisible(region);

        try {
          const features = mapRef.current?.querySourceFeatures(sourceId);
          if (!features || features.length === 0) return;
          features.forEach((feature) => {
            if (feature.id !== undefined && feature.id !== null) {
              try {
                mapRef.current?.setFeatureState(
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
    };

    updateVisibility();

    const handleIdle = () => {
      updateVisibility();
      map.off("idle", handleIdle);
    };

    map.once("idle", handleIdle);
  }, [year, minYear, maxYear, geographicRegions]);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const map = mapRef.current;
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
  }, [contextHoveredRegionId, geographicRegions]);

  const setupHoverHandlers = (
    map: mapboxgl.Map,
    regions: GeographicRegion[]
  ) => {
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
  };

  return (
    <div id="map-container" ref={mapContainerRef} className="h-full w-full" />
  );
}

