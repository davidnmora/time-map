"use client";

import { forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  formatTimeRange,
  TOOLTIP_WIDTH,
  type TooltipData,
} from "../map/map-utils";

type RegionTooltipProps = {
  data: TooltipData;
  x: number;
  y: number;
};

export const RegionTooltip = forwardRef<HTMLDivElement, RegionTooltipProps>(
  function RegionTooltip({ data, x, y }, ref) {
    if (typeof document === "undefined") return null;

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
          left: x,
          top: y - 10,
          transform: "translateX(calc(-100% - 10px))",
          width: TOOLTIP_WIDTH,
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
