import type {
  TimeBoundGeographicRegion,
  TimeBoundGeographicRegionGroup,
  TimeRange,
} from "../types/data";
import type { GeographicRegion } from "../components/Map";

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

export function getMinMaxYears(
  group: TimeBoundGeographicRegionGroup
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  function traverse(
    item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup
  ) {
    if ("children" in item) {
      item.children.forEach(traverse);
    } else {
      const [startYear, endYear] = item.timeRange;
      min = Math.min(min, startYear);
      if (endYear !== null) {
        max = Math.max(max, endYear);
      } else {
        max = Math.max(max, new Date().getFullYear());
      }
    }
  }

  traverse(group);

  return { min, max };
}

export function filterRegionsByYear(
  group: TimeBoundGeographicRegionGroup,
  year: number
): TimeBoundGeographicRegion[] {
  const regions: TimeBoundGeographicRegion[] = [];

  function traverse(
    item: TimeBoundGeographicRegion | TimeBoundGeographicRegionGroup
  ) {
    if ("children" in item) {
      item.children.forEach(traverse);
    } else {
      if (timeRangeOverlapsYear(item.timeRange, year)) {
        regions.push(item);
      }
    }
  }

  traverse(group);
  return regions;
}

export function convertToMapRegions(
  timeBoundRegions: TimeBoundGeographicRegion[]
): GeographicRegion[] {
  return timeBoundRegions.flatMap((region) =>
    region.geographicRegions.map((geoRegion, index) => ({
      id: `${region.metadata.id}-${index}`,
      data: geoRegion,
      fillColor: region.metadata.color,
      fillOpacity: 0.5,
      lineColor: "#000",
      lineWidth: 2,
    }))
  );
}

