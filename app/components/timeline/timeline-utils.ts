import type { TimeRange, Metadata } from "../../data/types";

export type RegionStrip = {
  id: string;
  timeRange: TimeRange;
  color?: string;
  metadata?: Metadata;
  hierarchy?: string[];
  area: number;
};

export type Column = RegionStrip[];

export const MIN_STRIP_WIDTH = 2;
export const MAX_STRIP_WIDTH = 30;
export const DEFAULT_STRIP_WIDTH = 3;

export function createGetWidthEncodingValue(
  domain: number[],
  domainKey: keyof RegionStrip
): (region: RegionStrip) => number {
  if (domain.length === 0) {
    return () => DEFAULT_STRIP_WIDTH;
  }
  const domainMin = Math.min(...domain.filter((a) => a > 0));
  const domainMax = Math.max(...domain);
  if (domainMin === domainMax || domainMax === 0) {
    return () => DEFAULT_STRIP_WIDTH;
  }
  return (region: RegionStrip) => {
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

export function computeRegionColumns(regions: RegionStrip[]): Column[] {
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
