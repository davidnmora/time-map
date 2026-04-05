import type { GeoJSON } from "geojson";

export type Metadata = {
  id: string;
  title: string;
  description?: string;
  color: string;
};

export type TimeRange = [number, number | null];

export type GeographicRegion = GeoJSON.FeatureCollection;

export type TimeBoundGeographicRegion = {
  timeRange: TimeRange;
  geographicRegions: GeographicRegion[];
  metadata: Metadata;
  area: number;
  hierarchy: string[];
};

export type TimeBoundGeographicRegionGroup = {
  children: (TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup)[];
  metadata: Metadata;
  hierarchy: string[];
};

export type PartialTimeBoundGeographicRegion = Omit<
  TimeBoundGeographicRegion,
  "area" | "hierarchy"
>;

export type PartialTimeBoundGeographicRegionGroup = {
  children: (
    | PartialTimeBoundGeographicRegion
    | PartialTimeBoundGeographicRegionGroup
  )[];
  metadata: Metadata;
};

