"use client";

import * as d3 from "d3";
import { CurrentYearIndicator } from "./CurrentYearIndicator";
import {
  TIMELINE_WIDTH,
  generateDecadeTicks,
  generateFiftyYearMarks,
} from "./axis/timeline-axis-utils";
import { TimelineTicks } from "./axis/TimelineTicks";
import { TimelineLabels } from "./axis/TimelineLabels";
import { TimelineGuidelines } from "./axis/TimelineGuidelines";

type TimelineAxisProps = {
  height: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  totalWidth: number;
};

export const TimelineAxis = ({ height, minYear, maxYear, currentYear, totalWidth }: TimelineAxisProps) => {
  const yScale = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([height, 0]);

  const decadeTicks = generateDecadeTicks(minYear, maxYear);
  const fiftyYearMarks = generateFiftyYearMarks(minYear, maxYear);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: TIMELINE_WIDTH + totalWidth, height: height }}
    >
      <div
        className="relative overflow-hidden"
        style={{ width: TIMELINE_WIDTH, height: height }}
      >
        <div className="relative w-full h-full">
          <TimelineTicks decadeTicks={decadeTicks} yScale={yScale} />
          <TimelineLabels decadeTicks={decadeTicks} yScale={yScale} />
        </div>
      </div>
      <TimelineGuidelines
        fiftyYearMarks={fiftyYearMarks}
        yScale={yScale}
        totalWidth={totalWidth}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          left: TIMELINE_WIDTH,
          top: 0,
          width: totalWidth,
          height: height,
        }}
      >
        <CurrentYearIndicator
          height={height}
          minYear={minYear}
          maxYear={maxYear}
          currentYear={currentYear}
          totalWidth={totalWidth}
        />
      </div>
    </div>
  );
};

