"use client";

import Map from "./components/map/Map";
import { completeDataset } from "./data/complete-dataset";
import { getAFlagListOfAllRegions } from "./data/data-utils";
import {
  renderTooltip,
  convertAllToMapRegions,
} from "./components/map/map-utils";
import { Timeline } from "./components/timeline/Timeline";
import { HoveredElementProvider } from "./contexts/HoveredElementContext";
import { AppStateProvider, useAppState } from "./contexts/AppStateContext";
import { calculateTimelineWidth } from "./components/timeline/timeline-utils";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { Suspense, useState, useEffect } from "react";

function MapContent() {
  const {
    zoom,
    center,
    pitch,
    bearing,
    currentYear,
    minYear,
    maxYear,
    timelineExpanded,
    updateState,
  } = useAppState();
  const [windowHeight, setWindowHeight] = useState(800);

  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const timelineRegions = getAFlagListOfAllRegions(completeDataset);
  const timelineWidth = calculateTimelineWidth(timelineRegions, "area");

  const geographicRegions = convertAllToMapRegions(completeDataset);

  return (
    <HoveredElementProvider>
      <div className="h-screen w-screen relative">
        <div className="absolute inset-0">
          <Map
            center={center}
            zoom={zoom}
            pitch={pitch}
            bearing={bearing}
            geographicRegions={geographicRegions}
            renderTooltip={renderTooltip}
            timelineExpanded={timelineExpanded}
            timelineWidth={timelineWidth}
          />
        </div>
        {isFinite(minYear) && isFinite(maxYear) && (
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
