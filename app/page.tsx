"use client";

import dynamic from "next/dynamic";
import { completeDataset } from "./data/complete-dataset";
import { getAFlagListOfAllRegions } from "./data/data-utils";
import { Timeline } from "./components/timeline/Timeline";
import { HoveredElementProvider } from "./contexts/HoveredElementContext";
import { AppStateProvider, useAppState } from "./contexts/AppStateContext";
import "./globals.css";
import { Suspense, useState, useEffect, startTransition } from "react";

const ThreeJSMap = dynamic(
  () => import("./components/threejs-map/ThreeJSMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black" aria-hidden />
    ),
  },
);

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
          <ThreeJSMap />
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
