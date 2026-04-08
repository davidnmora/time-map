"use client";

import * as d3 from "d3";
import { CurrentYearIndicator } from "./CurrentYearIndicator";
import {
  TIMELINE_AXIS_WIDTH,
  determineDensityLevel,
  generateTicksForDensityLevel,
  CENTURY_FONT_SIZE,
} from "./timeline-axis-utils";
import { TimelineTicks } from "./TimelineTicks";
import { TimelineLabels } from "./TimelineLabels";
import { TimelineGuidelines } from "./TimelineGuidelines";

type TimelineAxisProps = {
  height: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  totalWidth: number;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
};

export const TimelineAxis = ({
  height,
  minYear,
  maxYear,
  currentYear,
  totalWidth,
  scaleYearToPageY,
}: TimelineAxisProps) => {
  const densityLevel = determineDensityLevel(
    height,
    minYear,
    maxYear,
    CENTURY_FONT_SIZE
  );
  const ticks = generateTicksForDensityLevel(densityLevel, minYear, maxYear);

  const isInTheFuture = (year: number) => {
    return year > new Date().getFullYear();
  };

  const getAxisElementColor = (year: number) => {
    return isInTheFuture(year) ? "rgba(0, 0, 0, 0.1)" : "rgba(40, 40, 40, 0.6)";
  };

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: TIMELINE_AXIS_WIDTH + totalWidth, height: height }}
    >
      <div
        className="relative overflow-hidden"
        style={{ width: TIMELINE_AXIS_WIDTH, height: height }}
      >
        <div className="relative w-full h-full">
          <TimelineTicks
            ticks={ticks}
            scaleYearToPageY={scaleYearToPageY}
            getAxisElementColor={getAxisElementColor}
          />
          <TimelineLabels
            ticks={ticks}
            scaleYearToPageY={scaleYearToPageY}
            getAxisElementColor={getAxisElementColor}
          />
        </div>
      </div>
      <TimelineGuidelines
        ticks={ticks}
        scaleYearToPageY={scaleYearToPageY}
        totalWidth={totalWidth}
        getAxisElementColor={getAxisElementColor}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: TIMELINE_AXIS_WIDTH + totalWidth,
          height: height,
        }}
      >
        <CurrentYearIndicator
          height={height}
          currentYear={currentYear}
          totalWidth={TIMELINE_AXIS_WIDTH + totalWidth}
          scaleYearToPageY={scaleYearToPageY}
        />
      </div>
    </div>
  );
};

