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

const DEFAULT_OPACITY = 0.7;
const DEFAULT_OPACITY_IF_NOT_OVERLAPPING_WITH_CURRENT_YEAR = 0.4;
const HOVERED_OPACITY = 1;
const COUNTRY_LABEL_FONT_SIZE = 8;
const COUNTRY_LABEL_PADDING = 4;
const COUNTRY_LABEL_MIN_VISIBLE_HEIGHT = COUNTRY_LABEL_FONT_SIZE * 2;

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

type LabelPlacement = {
  top: number;
  height: number;
  anchorAtBottom: boolean;
};

function computeLabelPlacement(
  stripY: number,
  stripHeight: number,
  timeRange: TimeRange,
  currentYear: number,
  scaleYearToPageY: d3.ScaleLinear<number, number>,
): LabelPlacement {
  const overlapping = isTimeRangeActive(timeRange, currentYear);

  if (overlapping) {
    const currentYearRelY = scaleYearToPageY(currentYear) - stripY;
    const clampedHeight = Math.max(0, Math.min(currentYearRelY, stripHeight));
    return {
      top: COUNTRY_LABEL_PADDING,
      height: clampedHeight - COUNTRY_LABEL_PADDING * 2,
      anchorAtBottom: true,
    };
  }

  const [startYear] = timeRange;
  if (startYear > currentYear) {
    return {
      top: COUNTRY_LABEL_PADDING,
      height: stripHeight - COUNTRY_LABEL_PADDING * 2,
      anchorAtBottom: true,
    };
  }

  return {
    top: COUNTRY_LABEL_PADDING,
    height: stripHeight - COUNTRY_LABEL_PADDING * 2,
    anchorAtBottom: false,
  };
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
      width: columnWidth,
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

  const showLabels = columnWidth >= COUNTRY_LABEL_FONT_SIZE;

  return (
    <>
      <div
        className="relative block"
        style={{ width: columnWidth, height: height }}
      >
        {strips.map((strip) => {
          const isHovered = hoveredRegionId === strip.metadata.id;
          const labelPlacement = showLabels
            ? computeLabelPlacement(
                strip.y,
                strip.height,
                strip.timeRange,
                currentYear,
                scaleYearToPageY,
              )
            : null;
          const labelVisible =
            labelPlacement !== null &&
            labelPlacement.height >= COUNTRY_LABEL_MIN_VISIBLE_HEIGHT;

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
                  currentYear,
                ),
                cursor: "pointer",
              }}
              onMouseEnter={(e) => handleMouseEnter(e, strip)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {labelVisible && labelPlacement && (
                <div
                  className="absolute left-0 overflow-hidden pointer-events-none flex justify-center"
                  style={{
                    top: labelPlacement.top,
                    width: strip.width,
                    height: labelPlacement.height,
                    alignItems: labelPlacement.anchorAtBottom
                      ? "flex-end"
                      : "flex-start",
                  }}
                >
                  <span
                    className="whitespace-nowrap overflow-hidden text-white/80"
                    style={{
                      writingMode: "vertical-rl",
                      transform: labelPlacement.anchorAtBottom
                        ? "rotate(180deg)"
                        : undefined,
                      direction: labelPlacement.anchorAtBottom
                        ? undefined
                        : "rtl",
                      fontSize: COUNTRY_LABEL_FONT_SIZE,
                    }}
                  >
                    {strip.metadata.title}
                  </span>
                </div>
              )}
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
