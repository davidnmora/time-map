import type {
  TimeBoundGeographicRegion,
  TimeBoundGeographicRegionGroup,
  TimeRange,
  GeographicRegion,
} from "./types";
import * as turf from "@turf/turf";

export function calculateTotalArea(geographicRegions?: GeographicRegion[]): number {
  return (geographicRegions || []).reduce(
    (total, geoRegion) => total + turf.area(geoRegion),
    0
  );
}

export function addTitleToHierarchy(
  hierarchy: string[],
  title: string
): string[] {
  return [...hierarchy, title];
}

function timeRangeOverlapsYear(timeRange: TimeRange, year: number): boolean {
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

export function traverseRegionsByYear(
  item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup,
  year: number,
  hierarchy: string[] = []
): RegionWithHierarchy[] {
  if ("children" in item) {
    return item.children.flatMap((child) =>
      traverseRegionsByYear(child, year, hierarchy)
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

function traverseAllRegions(
  item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup
): TimeBoundGeographicRegion[] {
  if ("children" in item) {
    const group = item as TimeBoundGeographicRegionGroup;
    return group.children.flatMap((child) => traverseAllRegions(child));
  } else {
    return [item];
  }
}

export function getAFlagListOfAllRegions(
  group: TimeBoundGeographicRegionGroup
): TimeBoundGeographicRegion[] {
  return traverseAllRegions(group);
}

export function isTimeRangeActive(
  timeRange: TimeRange | undefined,
  year: number,
  minYear?: number,
  maxYear?: number
): boolean {
  if (!timeRange) return true;

  const [startYear, endYear] = timeRange;
  const currentYear = new Date().getFullYear();
  const effectiveEndYear = endYear !== null ? endYear : currentYear;

  const overlapsYear = effectiveEndYear >= year && startYear <= year;
  if (!overlapsYear) return false;

  if (minYear === undefined && maxYear === undefined) return true;

  if (minYear !== undefined && effectiveEndYear < minYear) return false;
  if (maxYear !== undefined && startYear > maxYear) return false;
  return true;
}
