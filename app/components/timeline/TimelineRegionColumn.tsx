"use client";

import * as d3 from "d3";
import type { TimeRange } from "../../data/types";

const REGION_STRIP_WIDTH = 3;
const MARGIN = { top: 30, bottom: 30 };

type RegionStrip = {
  id: string;
  timeRange: TimeRange;
  color?: string;
};

type TimelineRegionColumnProps = {
  height: number;
  minYear: number;
  maxYear: number;
  regions: RegionStrip[];
};

export const TimelineRegionColumn = ({
  height,
  minYear,
  maxYear,
  regions,
}: TimelineRegionColumnProps) => {
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const yScale = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([boundsHeight, 0]);

  const strips = regions.map((region) => {
    const [startYear, endYear] = region.timeRange;
    const currentYear = new Date().getFullYear();
    const effectiveEndYear = endYear !== null ? endYear : currentYear;

    const startY = yScale(effectiveEndYear);
    const endY = yScale(startYear);
    const stripHeight = Math.abs(endY - startY);

    return {
      ...region,
      y: Math.min(startY, endY),
      height: Math.max(stripHeight, 1),
    };
  });

  return (
    <svg width={REGION_STRIP_WIDTH} height={height} className="block">
      <g transform={`translate(0,${MARGIN.top})`}>
        {strips.map((strip) => (
          <rect
            key={strip.id}
            x={0}
            y={strip.y}
            width={REGION_STRIP_WIDTH}
            height={strip.height}
            fill={strip.color || "#0080ff"}
            opacity={0.7}
          />
        ))}
      </g>
    </svg>
  );
};
