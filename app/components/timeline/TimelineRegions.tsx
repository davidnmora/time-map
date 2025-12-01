"use client";

import { TimelineRegionColumn } from "./TimelineRegionColumn";
import type { TimeRange } from "../../data/types";

type RegionStrip = {
  id: string;
  timeRange: TimeRange;
  color?: string;
};

type TimelineRegionsProps = {
  height: number;
  minYear: number;
  maxYear: number;
  regions: RegionStrip[];
};

type Column = RegionStrip[];

function timeRangesOverlap(
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

function computeRegionColumns(regions: RegionStrip[]): Column[] {
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

export const TimelineRegions = ({
  height,
  minYear,
  maxYear,
  regions,
}: TimelineRegionsProps) => {
  const columns = computeRegionColumns(regions);

  return (
    <div className="flex" style={{ height: height }}>
      {columns.map((columnRegions, index) => (
        <TimelineRegionColumn
          key={index}
          height={height}
          minYear={minYear}
          maxYear={maxYear}
          regions={columnRegions}
        />
      ))}
    </div>
  );
};
