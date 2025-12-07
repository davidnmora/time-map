"use client";

import * as d3 from "d3";
import { TimelineRegionColumn } from "./TimelineRegionColumn";
import {
  computeRegionColumns,
  createGetWidthEncodingValue,
  DEFAULT_STRIP_WIDTH,
} from "../timeline-utils";
import { TimeBoundGeographicRegion } from "@/app/data/types";

type TimelineRegionsProps = {
  height: number;
  currentYear: number;
  regions: TimeBoundGeographicRegion[];
  widthEncodingKey?: keyof TimeBoundGeographicRegion;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
};

export const TimelineRegions = ({
  height,
  currentYear,
  regions,
  widthEncodingKey = "area",
  scaleYearToPageY,
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
    const columnWidth = Math.max(...stripWidths, DEFAULT_STRIP_WIDTH);
    return { columnRegions, columnWidth };
  });

  return (
    <div className="relative flex" style={{ height: height }}>
      {columnsWithWidths.map(({ columnRegions, columnWidth }, index) => (
        <TimelineRegionColumn
          key={index}
          height={height}
          currentYear={currentYear}
          regions={columnRegions}
          columnWidth={columnWidth}
          scaleYearToPageY={scaleYearToPageY}
        />
      ))}
    </div>
  );
};

