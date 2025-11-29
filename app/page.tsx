"use client";

import Map from "./components/Map";
import { useURLState } from "./hooks/useURLState";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { useMemo, Suspense } from "react";

function MapContent() {
  const { zoom, center, setURLState } = useURLState();

  // Default values if not in URL
  const mapZoom = zoom ?? 3;
  const mapCenter: [number, number] = center ?? [-68.137343, 45.137451];
  const mapStyle = "mapbox://styles/davidnmora/cmikmelfl004601sqcjoe98co";
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  const handlePositionUpdated = (
    newCenter: [number, number],
    newZoom: number
  ) => {
    setURLState({
      center: newCenter,
      zoom: newZoom,
    });
  };

  // For now, no geographic regions - will be added in part 3
  const geographicRegions = useMemo(() => [], []);

  if (!accessToken) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <p className="text-red-500">
          Mapbox access token is not configured. Please set
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <Map
        center={mapCenter}
        zoom={mapZoom}
        style={mapStyle}
        accessToken={accessToken}
        onPositionUpdated={handlePositionUpdated}
        geographicRegions={geographicRegions}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center">
          <p>Loading map...</p>
        </div>
      }
    >
      <MapContent />
    </Suspense>
  );
}
