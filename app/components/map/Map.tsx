"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { GeoJSON } from "geojson";
import { updateGeographicRegions } from "./map-utils";

export type GeographicRegion = {
  id: string;
  data: GeoJSON.Feature | GeoJSON.FeatureCollection;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
};

type MapProps = {
  center: [number, number];
  zoom: number;
  style: string;
  accessToken: string;
  onPositionUpdated: (center: [number, number], zoom: number) => void;
  geographicRegions?: GeographicRegion[];
};

export default function Map({
  center,
  zoom,
  style,
  accessToken,
  onPositionUpdated,
  geographicRegions = [],
}: MapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const sourcesRef = useRef<Set<string>>(new Set());
  const isUserInteractionRef = useRef(false);
  const onPositionUpdatedRef = useRef(onPositionUpdated);

  // Keep the callback ref up to date
  useEffect(() => {
    onPositionUpdatedRef.current = onPositionUpdated;
  }, [onPositionUpdated]);

  // Initialize map
  useEffect(() => {
    if (!accessToken) {
      console.error("Mapbox access token is not provided");
      return;
    }

    mapboxgl.accessToken = accessToken;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLElement,
      center,
      zoom,
      style,
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

  // Handle geographic regions - add/remove sources and layers
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Wait for map to be ready
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => {
        if (mapRef.current) {
          updateGeographicRegions(
            mapRef.current,
            sourcesRef,
            geographicRegions
          );
        }
      });
      return;
    }

    updateGeographicRegions(map, sourcesRef, geographicRegions);
  }, [geographicRegions]);

  return (
    <div
      id="map-container"
      ref={mapContainerRef}
      className="h-full w-full"
    />
  );
}

