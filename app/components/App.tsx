"use client";
import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";


function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Mapbox access token is not configured");
      return;
    }
    mapboxgl.accessToken = accessToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLElement,
    });
    mapRef.current.setStyle(
      "mapbox://styles/davidnmora/cmikmelfl004601sqcjoe98co"
    );

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
