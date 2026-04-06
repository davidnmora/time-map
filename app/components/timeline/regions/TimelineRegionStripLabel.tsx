"use client";

import * as d3 from "d3";
import type { TimeRange } from "../../../data/types";
import { isTimeRangeActive } from "@/app/data/data-utils";

const COUNTRY_LABEL_MIN_FONT_SIZE = 7;
const COUNTRY_LABEL_MAX_FONT_SIZE = 16;
const COUNTRY_LABEL_PADDING = 4;
const COUNTRY_LABEL_MIN_VISIBLE_HEIGHT_FONT_MULTIPLIER = 2;

function computeLabelFontSize(stripWidth: number): number {
  return Math.min(
    COUNTRY_LABEL_MAX_FONT_SIZE,
    Math.max(COUNTRY_LABEL_MIN_FONT_SIZE, Math.floor(stripWidth)),
  );
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

type TimelineRegionStripLabelProps = {
  columnWidth: number;
  stripY: number;
  stripHeight: number;
  stripWidth: number;
  timeRange: TimeRange;
  currentYear: number;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
  title: string | undefined;
};

export const TimelineRegionStripLabel = ({
  columnWidth,
  stripY,
  stripHeight,
  stripWidth,
  timeRange,
  currentYear,
  scaleYearToPageY,
  title,
}: TimelineRegionStripLabelProps) => {
  const fontSize = computeLabelFontSize(stripWidth);
  const minVisibleLabelHeight =
    fontSize * COUNTRY_LABEL_MIN_VISIBLE_HEIGHT_FONT_MULTIPLIER;
  const showLabels = columnWidth >= COUNTRY_LABEL_MIN_FONT_SIZE;
  const labelPlacement = showLabels
    ? computeLabelPlacement(
        stripY,
        stripHeight,
        timeRange,
        currentYear,
        scaleYearToPageY,
      )
    : null;
  const labelVisible =
    labelPlacement !== null && labelPlacement.height >= minVisibleLabelHeight;

  if (!labelVisible || !labelPlacement) {
    return null;
  }

  return (
    <div
      className="absolute left-0 overflow-hidden pointer-events-none flex justify-center"
      style={{
        top: labelPlacement.top,
        width: stripWidth,
        height: labelPlacement.height,
        alignItems: labelPlacement.anchorAtBottom ? "flex-end" : "flex-start",
      }}
    >
      <span
        className="whitespace-nowrap overflow-hidden text-white/80"
        style={{
          writingMode: "vertical-rl",
          transform: labelPlacement.anchorAtBottom
            ? "rotate(180deg)"
            : undefined,
          direction: labelPlacement.anchorAtBottom ? undefined : "rtl",
          fontSize,
        }}
      >
        {title}
      </span>
    </div>
  );
};
