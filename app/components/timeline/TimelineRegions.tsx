"use client";

import { TimelineRegionColumn } from "./TimelineRegionColumn";
import type { TimeRange, Metadata } from "../../data/types";

type RegionStrip = {
  id: string;
  timeRange: TimeRange;
  color?: string;
  metadata?: Metadata;
  hierarchy?: string[];
  area: number;
};

type TimelineRegionsProps = {
  height: number;
  minYear: number;
  maxYear: number;
  regions: RegionStrip[];
  widthEncodingKey?: keyof RegionStrip;
};

type Column = RegionStrip[];

const MIN_STRIP_WIDTH = 2;
const MAX_STRIP_WIDTH = 30;
const DEFAULT_STRIP_WIDTH = 3;

function createGetWidthEncodingValue(
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
  widthEncodingKey = "area",
}: TimelineRegionsProps) => {
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

  return (
    <div className="flex" style={{ height: height }}>
      {columnsWithWidths.map(({ columnRegions, columnWidth }, index) => (
        <TimelineRegionColumn
          key={index}
          height={height}
          minYear={minYear}
          maxYear={maxYear}
          regions={columnRegions}
          columnWidth={columnWidth}
          getWidthEncodingValue={getWidthEncodingValue}
        />
      ))}
    </div>
  );
};
