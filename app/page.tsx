"use client";

import Map from "./components/Map";
import YearSlider from "./components/YearSlider";
import { useURLState } from "./hooks/useURLState";
import { getAllData } from "./data/all-data";
import {
  getMinMaxYears,
  filterRegionsByYear,
  convertToMapRegions,
} from "./utils/data";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { useMemo, Suspense } from "react";

function MapContent() {
  const { zoom, center, year, setURLState } = useURLState();

  const allData = useMemo(() => getAllData(), []);
  const { min: minYear, max: maxYear } = useMemo(
    () => getMinMaxYears(allData),
    [allData]
  );

  const currentYear =
    year ?? (isFinite(minYear) ? minYear : new Date().getFullYear());

  const filteredRegions = useMemo(
    () => filterRegionsByYear(allData, currentYear),
    [allData, currentYear]
  );

  const geographicRegions = useMemo(
    () => convertToMapRegions(filteredRegions),
    [filteredRegions]
  );

  const handleYearChange = (newYear: number) => {
    setURLState({ year: newYear });
  };

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
    <div className="h-screen w-screen relative">
      {isFinite(minYear) && isFinite(maxYear) && (
        <YearSlider
          minYear={minYear}
          maxYear={maxYear}
          currentYear={currentYear}
          onYearChange={handleYearChange}
        />
      )}
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
