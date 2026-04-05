"use client";

import dynamic from "next/dynamic";
import type { GeoJSON } from "geojson";
import { Suspense, startTransition, useEffect, useState } from "react";

import type { GeographicRegionMapLayer } from "./components/map/geographic-region-map-layer";
import { convertAllToMapRegions } from "./components/map/map-utils";
import { Timeline } from "./components/timeline/Timeline";
import { GEOJSON_OVERLAY_LINE_WIDTH_PX } from "./components/threejs-map/scene/constants";
import { AppStateProvider, useAppState } from "./contexts/AppStateContext";
import { HoveredElementProvider } from "./contexts/HoveredElementContext";
import { completeDataset } from "./data/complete-dataset";
import { getAFlagListOfAllRegions } from "./data/data-utils";
import modernCountries from "./data/modern-countries.json";
import "./globals.css";

const ThreeJSMap = dynamic(
  () => import("./components/threejs-map/ThreeJSMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black" aria-hidden />
    ),
  },
);

const THREE_JS_MAP_GEOGRAPHIC_REGIONS: GeographicRegionMapLayer[] = [
  {
    id: "modern-countries",
    data: modernCountries as GeoJSON.FeatureCollection,
    lineWidth: GEOJSON_OVERLAY_LINE_WIDTH_PX,
  },
];

const INTERACTIVE_MAP_REGIONS = convertAllToMapRegions(completeDataset);

function MapContent() {
  const {
    currentYear,
    minYear,
    maxYear,
    timelineExpanded,
    updateState,
  } = useAppState();
  const [windowHeight, setWindowHeight] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const timelineRegions = getAFlagListOfAllRegions(completeDataset);

  return (
    <HoveredElementProvider>
      <div className="h-screen w-screen relative">
        <div className="absolute inset-0">
          <ThreeJSMap
            geographicRegions={THREE_JS_MAP_GEOGRAPHIC_REGIONS}
            interactiveRegions={INTERACTIVE_MAP_REGIONS}
          />
        </div>
        {isMounted &&
          windowHeight !== null &&
          isFinite(minYear) &&
          isFinite(maxYear) && (
            <Timeline
              height={windowHeight}
              currentYear={currentYear}
              regions={timelineRegions}
              widthEncodingKey="area"
              expanded={timelineExpanded}
              onToggle={() =>
                updateState({ timelineExpanded: !timelineExpanded })
              }
            />
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
      <AppStateProvider>
        <MapContent />
      </AppStateProvider>
    </Suspense>
  );
}
