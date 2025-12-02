"use client";

import Map from "./components/map/Map";
import YearSlider from "./components/YearSlider";
import { useURLState } from "./hooks/useURLState";
import { getAllData } from "./data/all-data";
import {
  getMinMaxYears,
  convertToMapRegions,
  getAllRegions,
  filterRegionsByYearRange,
} from "./utils/data";
import { renderTooltip } from "./components/map/map-utils";
import { TimelineAndTimelineRegions } from "./components/timeline/TimelineAndTimelineRegions";
import { HoveredElementProvider } from "./contexts/HoveredElementContext";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { useMemo, Suspense, useState, useEffect } from "react";

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

  const allData = useMemo(() => getAllData(), []);
  const { min: dataMinYear, max: dataMaxYear } = useMemo(
    () => getMinMaxYears(allData),
    [allData]
  );

  const visibleMinYear = urlMinYear ?? dataMinYear;
  const visibleMaxYear = urlMaxYear ?? dataMaxYear;
  const currentYear =
    year ?? (isFinite(dataMinYear) ? dataMinYear : new Date().getFullYear());

  const timelineRegions = useMemo(() => {
    const allRegionsWithHierarchy = getAllRegions(allData);
    const filteredRegions = filterRegionsByYearRange(
      allRegionsWithHierarchy,
      visibleMinYear,
      visibleMaxYear
    );
    return filteredRegions.map(({ region, hierarchy }) => ({
      id: region.metadata.id,
      timeRange: region.timeRange,
      color: region.metadata.color,
      metadata: region.metadata,
      hierarchy,
    }));
  }, [allData, visibleMinYear, visibleMaxYear]);

  const geographicRegions = useMemo(
    () =>
      convertToMapRegions(allData, currentYear, visibleMinYear, visibleMaxYear),
    [allData, currentYear, visibleMinYear, visibleMaxYear]
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
      <div className="h-screen w-screen relative">
        {isFinite(dataMinYear) && isFinite(dataMaxYear) && (
          <YearSlider
            minYear={dataMinYear}
            maxYear={dataMaxYear}
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
        {isFinite(visibleMinYear) && isFinite(visibleMaxYear) && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 1000,
              pointerEvents: "auto",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <TimelineAndTimelineRegions
              height={windowHeight}
              minYear={visibleMinYear}
              maxYear={visibleMaxYear}
              selectedYear={currentYear}
              regions={timelineRegions}
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
