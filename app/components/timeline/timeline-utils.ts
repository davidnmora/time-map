import type { TimeRange, TimeBoundGeographicRegion } from "../../data/types";
import { TIMELINE_AXIS_WIDTH } from "./axis/timeline-axis-utils";

export type Column = TimeBoundGeographicRegion[];

export const MIN_STRIP_WIDTH = 2;
export const MAX_STRIP_WIDTH = 30;
export const DEFAULT_STRIP_WIDTH = 3;

export const BACKDROP_BLUR = `backdrop-blur-xs`;
export const BACKDROP_COLOR = "bg-white/50";

export function createGetWidthEncodingValue(
  domain: number[],
  domainKey: keyof TimeBoundGeographicRegion
): (region: TimeBoundGeographicRegion) => number {
  if (domain.length === 0) {
    return () => DEFAULT_STRIP_WIDTH;
  }
  const domainMin = Math.min(...domain.filter((a) => a > 0));
  const domainMax = Math.max(...domain);
  if (domainMin === domainMax || domainMax === 0) {
    return () => DEFAULT_STRIP_WIDTH;
  }
  return (region: TimeBoundGeographicRegion) => {
    const domainValue = Number(region[domainKey]);
    if (domainValue === 0) return MIN_STRIP_WIDTH;
    const normalized = (domainValue - domainMin) / (domainMax - domainMin);
    const width =
      MIN_STRIP_WIDTH + normalized * (MAX_STRIP_WIDTH - MIN_STRIP_WIDTH);
    return Math.round(width * 100) / 100;
  };
}

export function timeRangesOverlap(
  timeRange1: TimeRange,
  timeRange2: TimeRange
): boolean {
  const [start1, end1] = timeRange1;
  const [start2, end2] = timeRange2;
  const currentYear = new Date().getFullYear();
  const effectiveEnd1 = end1 !== null ? end1 : currentYear;
  const effectiveEnd2 = end2 !== null ? end2 : currentYear;
  return start1 <= effectiveEnd2 && start2 <= effectiveEnd1;
}

export function computeRegionColumns(
  regions: TimeBoundGeographicRegion[]
): Column[] {
  const sortedRegions = [...regions].sort((a, b) => {
    const [startA] = a.timeRange;
    const [startB] = b.timeRange;
    return startA - startB;
  });

  const columns: Column[] = [];

  for (const region of sortedRegions) {
    let placed = false;
    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      const hasOverlap = column.some((existingRegion) =>
        timeRangesOverlap(existingRegion.timeRange, region.timeRange)
      );

      if (!hasOverlap) {
        column.push(region);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([region]);
    }
  }

  return columns;
}

export const calculateTimelineWidth = (
  regions: TimeBoundGeographicRegion[],
  widthEncodingKey: keyof TimeBoundGeographicRegion = "area"
): number => {
  const columns = computeRegionColumns(regions);
  const domain = regions.map((region) => Number(region[widthEncodingKey]));
  const getWidthEncodingValue = createGetWidthEncodingValue(
    domain,
    widthEncodingKey
  );

  const columnsWithWidths = columns.map((columnRegions) => {
    const stripWidths = columnRegions.map((region) =>
      getWidthEncodingValue(region)
    );
    const columnWidth =
      Math.round(Math.max(...stripWidths, DEFAULT_STRIP_WIDTH) * 100) / 100;
    return { columnRegions, columnWidth };
  });

  const totalWidth = columnsWithWidths.reduce(
    (sum, { columnWidth }) => sum + columnWidth,
    0
  );

  return TIMELINE_AXIS_WIDTH + totalWidth;
};
