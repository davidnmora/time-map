"use client";

import dynamic from "next/dynamic";
import { Suspense, startTransition, useEffect, useState } from "react";

import type { GeographicRegionMapLayer } from "@/lib/regions/types";
import { convertAllToMapRegions } from "@/lib/regions/region-utils";
import { Timeline } from "./components/timeline/Timeline";
import { calculateExpandedTimelineWidth } from "./components/timeline/timeline-utils";
import { ModernCountryBordersToggle } from "./components/world/ModernCountryBordersToggle";
import { GEOJSON_OVERLAY_LINE_WIDTH_PX } from "./components/world/scene/constants";
import { AppStateProvider, useAppState } from "./contexts/AppStateContext";
import { HoveredElementProvider } from "./contexts/HoveredElementContext";
import { completeDataset } from "./data/complete-dataset";
import { getAFlagListOfAllRegions } from "./data/data-utils";
import { modernCountriesGeoJson } from "./data/modern-countries";
import "./globals.css";

const World = dynamic(
  () => import("./components/world/World"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black" aria-hidden />
    ),
  },
);

const MODERN_COUNTRY_BORDER_REGIONS: GeographicRegionMapLayer[] = [
  {
    id: "modern-countries",
    data: modernCountriesGeoJson,
    lineWidth: GEOJSON_OVERLAY_LINE_WIDTH_PX,
  },
];

const INTERACTIVE_MAP_REGIONS = convertAllToMapRegions(completeDataset);
const TIMELINE_WIDTH_ENCODING_KEY = "area";

function MapContent() {
  const {
    currentYear,
    minYear,
    maxYear,
    timelineExpanded,
    updateState,
  } = useAppState();
  const [windowDimensions, setWindowDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showModernCountryBorders, setShowModernCountryBorders] = useState(true);

  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
    const updateDimensions = () => {
      setWindowDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const timelineRegions = getAFlagListOfAllRegions(completeDataset);
  const timelineWidth = calculateExpandedTimelineWidth(
    windowDimensions?.width ?? 0,
  );

  return (
    <HoveredElementProvider>
      <div className="h-screen w-screen relative">
        <div className="absolute inset-0">
          <World
            modernCountryBorders={
              showModernCountryBorders ? MODERN_COUNTRY_BORDER_REGIONS : []
            }
            interactiveRegions={INTERACTIVE_MAP_REGIONS}
            timelineWidth={timelineWidth}
            timelineExpanded={timelineExpanded}
          />
        </div>
        <ModernCountryBordersToggle
          checked={showModernCountryBorders}
          onToggle={() =>
            setShowModernCountryBorders((previousValue) => !previousValue)
          }
        />
        {isMounted &&
          windowDimensions !== null &&
          isFinite(minYear) &&
          isFinite(maxYear) && (
            <Timeline
              height={windowDimensions.height}
              currentYear={currentYear}
              regions={timelineRegions}
              widthEncodingKey={TIMELINE_WIDTH_ENCODING_KEY}
              expandedWidth={timelineWidth}
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
