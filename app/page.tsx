"use client";

import Map from "./components/map/Map";
import YearSlider from "./components/YearSlider";
import { useURLState } from "./hooks/useURLState";
import { getAllData } from "./data/all-data";
import { getMinMaxYears, prepareTimelineRegions } from "./utils/data";
import { renderTooltip, convertToMapRegions } from "./components/map/map-utils";
import { TimelineAndTimelineRegions } from "./components/timeline/TimelineAndTimelineRegions";
import { HoveredElementProvider } from "./contexts/HoveredElementContext";
import { calculateTotalArea } from "./components/timeline/timeline-utils";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { Suspense, useState, useEffect } from "react";

function MapContent() {
  const {
    zoom,
    center,
    year,
    minYear: urlMinYear,
    maxYear: urlMaxYear,
    setURLState,
  } = useURLState();
  const [windowHeight, setWindowHeight] = useState(800);

  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const allData = getAllData();
  const { min: dataMinYear, max: dataMaxYear } = getMinMaxYears(allData);

  const visibleMinYear = urlMinYear ?? dataMinYear;
  const visibleMaxYear = urlMaxYear ?? dataMaxYear;
  const currentYear =
    year ?? (isFinite(dataMinYear) ? dataMinYear : new Date().getFullYear());

  const timelineRegions = prepareTimelineRegions(allData, calculateTotalArea);

  const geographicRegions = convertToMapRegions(
    allData,
    currentYear,
    visibleMinYear,
    visibleMaxYear
  );

  const handleYearChange = (newYear: number) => {
    setURLState({ year: newYear });
  };

  const handleZoomChange = (newMinYear: number, newMaxYear: number) => {
    setURLState({ minYear: newMinYear, maxYear: newMaxYear });
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
    <HoveredElementProvider>
      <div className="h-screen w-screen flex">
        {isFinite(dataMinYear) && isFinite(dataMaxYear) && (
          <YearSlider
            minYear={dataMinYear}
            maxYear={dataMaxYear}
            currentYear={currentYear}
            onYearChange={handleYearChange}
          />
        )}
        <div className="flex-1 relative">
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
        {isFinite(visibleMinYear) && isFinite(visibleMaxYear) && (
          <div className="bg-white overflow-hidden">
            <TimelineAndTimelineRegions
              height={windowHeight}
              minYear={visibleMinYear}
              maxYear={visibleMaxYear}
              selectedYear={currentYear}
              regions={timelineRegions}
              widthEncodingKey="area"
              onYearChange={handleYearChange}
              onZoomChange={handleZoomChange}
            />
          </div>
        )}
      </div>
    </HoveredElementProvider>
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
