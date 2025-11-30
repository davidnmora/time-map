"use client";

import Map from "./components/map/Map";
import YearSlider from "./components/YearSlider";
import { useURLState } from "./hooks/useURLState";
import { getAllData } from "./data/all-data";
import { getMinMaxYears, convertToMapRegions } from "./utils/data";
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

  const geographicRegions = useMemo(
    () => convertToMapRegions(allData, currentYear),
    [allData, currentYear]
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

  const formatTimeRange = (timeRange: [number, number | null]): string => {
    const [start, end] = timeRange;
    if (end === null) {
      return `${start} - present`;
    }
    return `${start} - ${end}`;
  };

  const renderTooltip = (data: {
    hierarchy: string[];
    title: string;
    description?: string;
    timeRange: [number, number | null];
  }): string => {
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
        renderTooltip={renderTooltip}
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
