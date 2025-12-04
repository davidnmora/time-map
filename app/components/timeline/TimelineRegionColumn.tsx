"use client";

import * as d3 from "d3";
import { useState } from "react";
import type { TimeRange, Metadata } from "../../data/types";
import { useHoveredElement } from "../../contexts/HoveredElementContext";
import { renderTooltip } from "../map/map-utils";

const MARGIN = { top: 30, bottom: 30 };
const DEFAULT_OPACITY = 0.3;
const HOVERED_OPACITY = 1;

// TODO: de-duplicate definition (and ideally the definition is for a global type, not a local type)
type RegionStrip = {
  id: string;
  timeRange: TimeRange;
  color?: string;
  metadata?: Metadata;
  hierarchy?: string[];
  area: number;
};

type TimelineRegionColumnProps = {
  height: number;
  minYear: number;
  maxYear: number;
  regions: RegionStrip[];
  columnWidth: number;
  getWidthEncodingValue: (region: RegionStrip) => number;
};

export const TimelineRegionColumn = ({
  height,
  minYear,
  maxYear,
  regions,
  columnWidth,
  getWidthEncodingValue,
}: TimelineRegionColumnProps) => {
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;
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
    e: React.MouseEvent<SVGRectElement>,
    strip: (typeof strips)[0]
  ) => {
    setHoveredRegionId(strip.id);
    if (strip.metadata) {
      const hierarchy = strip.hierarchy || [];
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

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
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
      <svg width={columnWidth} height={height} className="block">
        <g transform={`translate(0,${MARGIN.top})`}>
          {strips.map((strip) => {
            const isHovered = hoveredRegionId === strip.id;
            return (
              <rect
                key={strip.id}
                x={0}
                y={strip.y}
                width={strip.width}
                height={strip.height}
                fill={strip.color || "#0080ff"}
                opacity={isHovered ? HOVERED_OPACITY : DEFAULT_OPACITY}
                onMouseEnter={(e) => handleMouseEnter(e, strip)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </g>
      </svg>
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
