import type {
  TimeBoundGeographicRegion,
  TimeBoundGeographicRegionGroup,
  TimeRange,
} from "../data/types";
import type { GeographicRegion } from "../components/map/Map";

function timeRangeOverlapsYear(
  timeRange: TimeRange,
  year: number
): boolean {
  const [startYear, endYear] = timeRange;
  if (endYear === null) {
    return year >= startYear;
  }
  return year >= startYear && year <= endYear;
}

function traverseMinMaxYears(
  item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup
): { min: number; max: number } {
  if ("children" in item) {
    return item.children.map(traverseMinMaxYears).reduce(
      (acc, curr) => ({
        min: Math.min(acc.min, curr.min),
        max: Math.max(acc.max, curr.max),
      }),
      { min: Infinity, max: -Infinity }
    );
  } else {
    const [startYear, endYear] = item.timeRange;
    const currentYear = new Date().getFullYear();
    return {
      min: startYear,
      max: endYear !== null ? endYear : currentYear,
    };
  }
}

export function getMinMaxYears(group: TimeBoundGeographicRegionGroup): {
  min: number;
  max: number;
} {
  return traverseMinMaxYears(group);
}

type RegionWithHierarchy = {
  region: TimeBoundGeographicRegion;
  hierarchy: string[];
};

function traverseRegionsByYear(
  item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup,
  year: number,
  hierarchy: string[] = []
): RegionWithHierarchy[] {
  if ("children" in item) {
    const currentHierarchy = [...hierarchy, item.metadata.title];
    return item.children.flatMap((child) =>
      traverseRegionsByYear(child, year, currentHierarchy)
    );
  } else {
    if (timeRangeOverlapsYear(item.timeRange, year)) {
      return [{ region: item, hierarchy }];
    }
    return [];
  }
}

export function filterRegionsByYear(
  group: TimeBoundGeographicRegionGroup,
  year: number
): TimeBoundGeographicRegion[] {
  return traverseRegionsByYear(group, year).map((item) => item.region);
}

export function convertToMapRegions(
  group: TimeBoundGeographicRegionGroup,
  year: number
): GeographicRegion[] {
  const regionsWithHierarchy = traverseRegionsByYear(group, year);
  return regionsWithHierarchy.flatMap(({ region, hierarchy }) =>
    region.geographicRegions.map((geoRegion, index) => ({
      id: `${region.metadata.id}-${index}`,
      data: geoRegion,
      fillColor: region.metadata.color,
      fillOpacity: 0.5,
      lineColor: "#000",
      lineWidth: 2,
      metadata: region.metadata,
      timeRange: region.timeRange,
      hierarchy: [...hierarchy, region.metadata.title],
    }))
  );
}

