import type { GeoJSON } from "geojson";
import type { Metadata, TimeRange } from "@/app/data/types";

export type GeographicRegionMapLayer = {
  id: string;
  data: GeoJSON.Feature | GeoJSON.FeatureCollection;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
  metadata?: Metadata;
  timeRange?: TimeRange;
  hierarchy?: string[];
};

export type InteractiveGeographicRegionMapLayer = Omit<
  GeographicRegionMapLayer,
  "fillColor"
> & {
  fillColor: string;
};
