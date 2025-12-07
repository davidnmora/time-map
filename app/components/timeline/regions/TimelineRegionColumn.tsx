"use client";

import * as d3 from "d3";
import { useState } from "react";
import { useHoveredElement } from "../../../contexts/HoveredElementContext";
import { renderTooltip } from "../../map/map-utils";
import type { TimeBoundGeographicRegion, TimeRange } from "../../../data/types";
import { isTimeRangeActive } from "@/app/data/data-utils";

const DEFAULT_OPACITY = 0.7;
const DEFAULT_OPACITY_IF_NOT_OVERLAPPING_WITH_CURRENT_YEAR = 0.4;
const HOVERED_OPACITY = 1;

function getRegionOpacity(
  isHovered: boolean,
  timeRange: TimeRange,
  currentYear: number
): number {
  if (isHovered) {
    return HOVERED_OPACITY;
  }
  const isOverlappingWithCurrentYear = isTimeRangeActive(
    timeRange,
    currentYear
  );
  return isOverlappingWithCurrentYear
    ? DEFAULT_OPACITY
    : DEFAULT_OPACITY_IF_NOT_OVERLAPPING_WITH_CURRENT_YEAR;
}

type TimelineRegionColumnProps = {
  height: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  regions: TimeBoundGeographicRegion[];
  columnWidth: number;
  getWidthEncodingValue: (region: TimeBoundGeographicRegion) => number;
};

export const TimelineRegionColumn = ({
  height,
  minYear,
  maxYear,
  currentYear,
  regions,
  columnWidth,
  getWidthEncodingValue,
}: TimelineRegionColumnProps) => {
  const boundsHeight = height;
  const { hoveredRegionId, setHoveredRegionId } = useHoveredElement();
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    html: string;
  } | null>(null);

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
    const width = getWidthEncodingValue(region);

    return {
      ...region,
      y: Math.min(startY, endY),
      height: Math.max(stripHeight, 1),
      width,
    };
  });

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    strip: (typeof strips)[0]
  ) => {
    setHoveredRegionId(strip.metadata.id);
    if (strip.metadata) {
      const hierarchy = strip.hierarchy;
      const title = strip.metadata.title || "";
      const description = strip.metadata.description;
      const timeRange = strip.timeRange;

      const tooltipHtml = renderTooltip({
        hierarchy,
        title,
        description,
        timeRange,
      });

      setTooltipData({
        x: e.clientX,
        y: e.clientY,
        html: tooltipHtml,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tooltipData) {
      setTooltipData({
        ...tooltipData,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredRegionId(null);
    setTooltipData(null);
  };

  return (
    <>
      <div
        className="relative block"
        style={{ width: columnWidth, height: height }}
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
                width: strip.width,
                height: strip.height,
                backgroundColor: strip.metadata.color || "#0080ff",
                opacity: getRegionOpacity(
                  isHovered,
                  strip.timeRange,
                  currentYear
                ),
                cursor: "pointer",
              }}
              onMouseEnter={(e) => handleMouseEnter(e, strip)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>
      {tooltipData && (
        <div
          style={{
            position: "fixed",
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            pointerEvents: "none",
            zIndex: 10000,
            backgroundColor: "white",
            padding: "8px",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: "12px",
            maxWidth: "300px",
          }}
          dangerouslySetInnerHTML={{ __html: tooltipData.html }}
        />
      )}
    </>
  );
};

