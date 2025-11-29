"use client";
import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";


function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiZGF2aWRubW9yYSIsImEiOiJjanQ2NGt2eXYwOTd3NDlzMnF4NnBscWZjIn0.acsLJCvFw9LAVbhFVIm7yQ";
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLElement,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <>
      <div
        id="map-container"
        ref={mapContainerRef}
        className="h-full w-full"
      />
    </>
  );
}

export default App;
