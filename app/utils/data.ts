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

export function traverseRegionsByYear(
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

function traverseAllRegions(
  item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup,
  hierarchy: string[] = []
): RegionWithHierarchy[] {
  if ("children" in item) {
    const currentHierarchy = [...hierarchy, item.metadata.title];
    return item.children.flatMap((child) =>
      traverseAllRegions(child, currentHierarchy)
    );
  } else {
    return [{ region: item, hierarchy }];
  }
}

export function getAllRegions(
  group: TimeBoundGeographicRegionGroup
): RegionWithHierarchy[] {
  return traverseAllRegions(group);
}

function timeRangeOverlapsRange(
  timeRange: TimeRange,
  minYear: number,
  maxYear: number
): boolean {
  const [startYear, endYear] = timeRange;
  const currentYear = new Date().getFullYear();
  const effectiveEndYear = endYear !== null ? endYear : currentYear;
  return startYear <= maxYear && effectiveEndYear >= minYear;
}

export function filterRegionsByYearRange(
  regions: RegionWithHierarchy[],
  minYear: number,
  maxYear: number
): RegionWithHierarchy[] {
  return regions.filter(({ region }) =>
    timeRangeOverlapsRange(region.timeRange, minYear, maxYear)
  );
}

