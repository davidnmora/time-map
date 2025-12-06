"use client";

import { TimelineRegionColumn } from "./TimelineRegionColumn";
import {
  computeRegionColumns,
  createGetWidthEncodingValue,
  DEFAULT_STRIP_WIDTH,
} from "../timeline-utils";
import { TimeBoundGeographicRegion } from "@/app/data/types";

type TimelineRegionsProps = {
  height: number;
  minYear: number;
  maxYear: number;
  regions: TimeBoundGeographicRegion[];
  widthEncodingKey?: keyof TimeBoundGeographicRegion;
};

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
    <div className="relative flex" style={{ height: height }}>
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

