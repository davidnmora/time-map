"use client";

import * as d3 from "d3";
import { useState } from "react";
import { useHoveredElement } from "../../../contexts/HoveredElementContext";
import { RegionTooltip } from "../../shared/RegionTooltip";
import type {
  TimeBoundGeographicRegion,
  TimeRange,
} from "../../../data/types";
import type { TooltipData } from "@/lib/regions/region-utils";
import { isTimeRangeActive } from "@/app/data/data-utils";
import { TimelineRegionStripLabel } from "./TimelineRegionStripLabel";
import {
  TIMELINE_REGION_RESIZE_WIDTH_OPACITY_TRANSITION,
  TIMELINE_REGION_RESIZE_WIDTH_TRANSITION,
} from "../timeline-utils";

const DEFAULT_OPACITY = 0.7;
const DEFAULT_OPACITY_IF_NOT_OVERLAPPING_WITH_CURRENT_YEAR = 0.2;
const HOVERED_OPACITY = 1;

function getRegionOpacity(
  isHovered: boolean,
  timeRange: TimeRange,
  currentYear: number,
): number {
  if (isHovered) {
    return HOVERED_OPACITY;
  }
  const isOverlappingWithCurrentYear = isTimeRangeActive(
    timeRange,
    currentYear,
  );
  return isOverlappingWithCurrentYear
    ? DEFAULT_OPACITY
    : DEFAULT_OPACITY_IF_NOT_OVERLAPPING_WITH_CURRENT_YEAR;
}

type TimelineRegionColumnProps = {
  height: number;
  currentYear: number;
  regions: TimeBoundGeographicRegion[];
  columnWidth: number;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
};

type TooltipState = {
  data: TooltipData;
  x: number;
  y: number;
};

export const TimelineRegionColumn = ({
  height,
  currentYear,
  regions,
  columnWidth,
  scaleYearToPageY,
}: TimelineRegionColumnProps) => {
  const { hoveredRegionId, setHoveredRegionId } = useHoveredElement();
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);

  const strips = regions.map((region) => {
    const [startYear, endYear] = region.timeRange;
    const nowYear = new Date().getFullYear();
    const effectiveEndYear = endYear !== null ? endYear : nowYear;

    const startY = scaleYearToPageY(effectiveEndYear);
    const endY = scaleYearToPageY(startYear);
    const stripHeight = Math.abs(endY - startY);

    return {
      ...region,
      y: Math.min(startY, endY),
      height: Math.max(stripHeight, 1),
    };
  });

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    strip: (typeof strips)[0],
  ) => {
    setHoveredRegionId(strip.metadata.id);
    if (strip.metadata) {
      setTooltipState({
        x: e.clientX,
        y: e.clientY,
        data: {
          hierarchy: strip.hierarchy,
          title: strip.metadata.title || "",
          description: strip.metadata.description,
          timeRange: strip.timeRange,
        },
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setTooltipState((prev) =>
      prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
    );
  };

  const handleMouseLeave = () => {
    setHoveredRegionId(null);
    setTooltipState(null);
  };

  return (
    <>
      <div
        className="relative block"
        style={{
          width: columnWidth,
          height: height,
          transition: TIMELINE_REGION_RESIZE_WIDTH_TRANSITION,
        }}
      >
        {strips.map((strip) => {
          const isHovered = hoveredRegionId === strip.metadata.id;

          return (
            <div
              key={strip.metadata.id}
              className="absolute"
              style={{
                left: 0,
                top: strip.y,
                width: "100%",
                height: strip.height,
                backgroundColor: strip.metadata.color || "#0080ff",
                opacity: getRegionOpacity(
                  isHovered,
                  strip.timeRange,
                  currentYear,
                ),
                cursor: "pointer",
                transition: TIMELINE_REGION_RESIZE_WIDTH_OPACITY_TRANSITION,
              }}
              onMouseEnter={(e) => handleMouseEnter(e, strip)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <TimelineRegionStripLabel
                columnWidth={columnWidth}
                stripY={strip.y}
                stripHeight={strip.height}
                stripWidth={columnWidth}
                timeRange={strip.timeRange}
                currentYear={currentYear}
                scaleYearToPageY={scaleYearToPageY}
                title={strip.metadata.title}
              />
            </div>
          );
        })}
      </div>
      {tooltipState && (
        <RegionTooltip
          data={tooltipState.data}
          x={tooltipState.x}
          y={tooltipState.y}
        />
      )}
    </>
  );
};
