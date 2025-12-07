"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { GeoJSON } from "geojson";
import {
  initializeMapRegions,
  updateRegionVisibility,
  updateHoverStateFromContext,
  setupHoverHandlers,
  type TooltipData,
  type HoverHandlers,
} from "./map-utils";
import type { Metadata, TimeRange } from "../../data/types";
import { useHoveredElement } from "../../contexts/HoveredElementContext";
import { useAppState } from "../../contexts/AppStateContext";
import { isTimeRangeActive } from "../../utils/data";
import { TRANSITION_DURATION_MS } from "../timeline/axis/timeline-axis-utils";

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
  pitch: number;
  bearing: number;
  style: string;
  accessToken: string;
  geographicRegions?: GeographicRegion[];
  renderTooltip?: (data: TooltipData) => string;
  timelineExpanded?: boolean;
  timelineWidth?: number;
};

export default function Map(props: MapProps) {
  if (!props) {
    return null;
  }

  const {
    center,
    zoom,
    pitch = 0,
    bearing = 0,
    style,
    accessToken,
    geographicRegions = [],
    renderTooltip,
    timelineExpanded = false,
    timelineWidth = 0,
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
  const timelineExpandedRef = useRef(timelineExpanded);
  const timelineWidthRef = useRef(timelineWidth);

  useEffect(() => {
    updateStateRef.current = updateState;
  }, [updateState]);

  useEffect(() => {
    timelineExpandedRef.current = timelineExpanded;
    timelineWidthRef.current = timelineWidth;
  }, [timelineExpanded, timelineWidth]);

  // Initialize map
  useEffect(() => {
    if (!accessToken || !center || typeof zoom !== "number" || !style) {
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    mapboxgl.accessToken = accessToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom,
      pitch,
      bearing,
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
      const newPitch = mapRef.current.getPitch();
      const newBearing = mapRef.current.getBearing();
      updateStateRef.current({
        center: [newCenter.lng, newCenter.lat],
        zoom: newZoom,
        pitch: newPitch,
        bearing: newBearing,
      });
      isUserInteractionRef.current = false;
    };

    mapRef.current.on("moveend", handleMoveEnd);
    mapRef.current.on("zoomend", handleMoveEnd);
    mapRef.current.on("pitchend", handleMoveEnd);
    mapRef.current.on("rotateend", handleMoveEnd);

    // Track user interactions
    mapRef.current.on("movestart", () => {
      isUserInteractionRef.current = true;
    });
    mapRef.current.on("zoomstart", () => {
      isUserInteractionRef.current = true;
    });
    mapRef.current.on("pitchstart", () => {
      isUserInteractionRef.current = true;
    });
    mapRef.current.on("rotatestart", () => {
      isUserInteractionRef.current = true;
    });

    const applyInitialPadding = () => {
      if (!mapRef.current) return;
      const padding =
        timelineExpandedRef.current && timelineWidthRef.current > 0
          ? { right: timelineWidthRef.current }
          : { right: 0 };
      mapRef.current.easeTo({
        padding,
        duration: TRANSITION_DURATION_MS,
      });
    };

    mapRef.current.once("load", applyInitialPadding);

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once

  // Update center, zoom, pitch, and bearing with smooth transitions
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if we need to update
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    const currentPitch = mapRef.current.getPitch();
    const currentBearing = mapRef.current.getBearing();
    const centerChanged =
      Math.abs(currentCenter.lng - center[0]) > 0.0001 ||
      Math.abs(currentCenter.lat - center[1]) > 0.0001;
    const zoomChanged = Math.abs(currentZoom - zoom) > 0.01;
    const pitchChanged = Math.abs(currentPitch - pitch) > 0.01;
    const bearingChanged = Math.abs(currentBearing - bearing) > 0.01;

    if (centerChanged || zoomChanged || pitchChanged || bearingChanged) {
      // Only transition if the change is significant (not from user interaction)
      if (!isUserInteractionRef.current) {
        mapRef.current.easeTo({
          center,
          zoom,
          pitch,
          bearing,
          duration: 500,
        });
      }
    }
  }, [center, zoom, pitch, bearing]);

  // Update map padding when timeline expands/collapses
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const padding =
      timelineExpanded && timelineWidth > 0
        ? { right: timelineWidth }
        : { right: 0 };

    mapRef.current.easeTo({
      padding,
      duration: TRANSITION_DURATION_MS,
    });
  }, [timelineExpanded, timelineWidth]);

  const initializedRef = useRef(false);

  const isRegionVisible = (region: GeographicRegion): boolean => {
    return isTimeRangeActive(region.timeRange, year, minYear, maxYear);
  };

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;

    const map = mapRef.current;

    const initialize = () => {
      if (!mapRef.current) return;

      const hoverHandlers: HoverHandlers = {
        hoveredFeatureRef,
        hoveredRegionIdRef,
        setHoveredRegionId,
        popupRef,
        renderTooltip,
        hoverHandlersRef,
      };

      initializeMapRegions(
        mapRef.current,
        sourcesRef,
        geographicRegions,
        (map, regions) => setupHoverHandlers(map, regions, hoverHandlers),
        isRegionVisible
      );
      initializedRef.current = true;
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

    updateRegionVisibility(map, geographicRegions, isRegionVisible);

    const handleIdle = () => {
      updateRegionVisibility(map, geographicRegions, isRegionVisible);
      map.off("idle", handleIdle);
    };

    map.once("idle", handleIdle);
  }, [year, minYear, maxYear, geographicRegions]);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    updateHoverStateFromContext(
      mapRef.current,
      geographicRegions,
      contextHoveredRegionId
    );
  }, [contextHoveredRegionId, geographicRegions]);

  return (
    <div id="map-container" ref={mapContainerRef} className="h-full w-full" />
  );
}

