"use client";

import { forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  formatTimeRange,
  TOOLTIP_WIDTH,
  type TooltipData,
} from "@/lib/regions/region-utils";

const TOOLTIP_CURSOR_OFFSET_X = 24;
const TOOLTIP_CURSOR_OFFSET_Y = 20;
const TOOLTIP_VIEWPORT_MARGIN = 12;
const MIN_TOOLTIP_AVAILABLE_SPACE = 80;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const getTooltipTransform = (
  isOnRightHalf: boolean,
  isOnBottomHalf: boolean,
): string => {
  const transforms = [
    isOnRightHalf ? "translateX(-100%)" : null,
    isOnBottomHalf ? "translateY(-100%)" : null,
  ].filter((transform): transform is string => Boolean(transform));

  return transforms.length > 0 ? transforms.join(" ") : "none";
};

type TooltipLayout = {
  left: number;
  top: number;
  tooltipWidth: number;
  maxTooltipHeight: number;
  isOnRightHalf: boolean;
  isOnBottomHalf: boolean;
};

const getTooltipLayout = (x: number, y: number): TooltipLayout => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isOnRightHalf = x >= viewportWidth / 2;
  const isOnBottomHalf = y >= viewportHeight / 2;

  const maxTooltipWidth = Math.max(
    MIN_TOOLTIP_AVAILABLE_SPACE,
    viewportWidth / 2 - TOOLTIP_CURSOR_OFFSET_X - TOOLTIP_VIEWPORT_MARGIN,
  );
  const maxTooltipHeight = Math.max(
    MIN_TOOLTIP_AVAILABLE_SPACE,
    viewportHeight / 2 - TOOLTIP_CURSOR_OFFSET_Y - TOOLTIP_VIEWPORT_MARGIN,
  );
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, maxTooltipWidth);

  const left = isOnRightHalf
    ? clamp(
        x - TOOLTIP_CURSOR_OFFSET_X,
        TOOLTIP_VIEWPORT_MARGIN + tooltipWidth,
        viewportWidth - TOOLTIP_VIEWPORT_MARGIN,
      )
    : clamp(
        x + TOOLTIP_CURSOR_OFFSET_X,
        TOOLTIP_VIEWPORT_MARGIN,
        viewportWidth - TOOLTIP_VIEWPORT_MARGIN - tooltipWidth,
      );
  const top = isOnBottomHalf
    ? y - TOOLTIP_CURSOR_OFFSET_Y
    : y + TOOLTIP_CURSOR_OFFSET_Y;

  return {
    left,
    top,
    tooltipWidth,
    maxTooltipHeight,
    isOnRightHalf,
    isOnBottomHalf,
  };
};

type RegionTooltipProps = {
  data: TooltipData;
  x: number;
  y: number;
};

export const RegionTooltip = forwardRef<HTMLDivElement, RegionTooltipProps>(
  function RegionTooltip({ data, x, y }, ref) {
    if (typeof document === "undefined") return null;

    const {
      left,
      top,
      tooltipWidth,
      maxTooltipHeight,
      isOnRightHalf,
      isOnBottomHalf,
    } = getTooltipLayout(x, y);
    const transform = getTooltipTransform(isOnRightHalf, isOnBottomHalf);

    const timeRangeText = formatTimeRange(data.timeRange);
    const hasHierarchy = data.hierarchy.length > 0;
    const hierarchyParts = data.hierarchy.slice(0, -1);
    const finalEntry = data.hierarchy[data.hierarchy.length - 1];
    const hierarchyPrefix =
      hierarchyParts.length > 0 ? `${hierarchyParts.join(" > ")} > ` : "";

    return createPortal(
      <div
        ref={ref}
        className="fixed pointer-events-none z-[10000] bg-white p-2 rounded shadow-lg text-xs"
        style={{
          left,
          top,
          transform,
          width: tooltipWidth,
          maxHeight: maxTooltipHeight,
          overflowY: "auto",
        }}
      >
        {hasHierarchy ? (
          <div className="mb-1 font-extralight">
            {hierarchyPrefix}
            <span className="font-semibold">{finalEntry}</span>
          </div>
        ) : (
          <div className="font-semibold mb-1">{data.title}</div>
        )}
        <div className="text-gray-500 font-mono">{timeRangeText}</div>
        {data.description && (
          <div className="mb-1 text-gray-500">{data.description}</div>
        )}
      </div>,
      document.body,
    );
  },
);
