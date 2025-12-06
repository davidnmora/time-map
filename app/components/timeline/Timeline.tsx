"use client";

import * as d3 from "d3";
import { CurrentYearIndicator } from "./CurrentYearIndicator";

const TIMELINE_WIDTH = 50;
const TICK_LENGTH = 6;
const TICK_OFFSET = 10;

const DECADE_FONT_SIZE = 12;
const CENTURY_FONT_SIZE = 16;
const BASELINE_OFFSET_RATIO = 0.67;

const calculateLabelTopOffset = (fontSize: number): number => {
  return -fontSize * BASELINE_OFFSET_RATIO;
};

const generateDecadeTicks = (minYear: number, maxYear: number): number[] => {
  const startDecade = Math.floor(minYear / 10) * 10;
  const endDecade = Math.ceil(maxYear / 10) * 10;
  const ticks: number[] = [];
  
  for (let year = startDecade; year <= endDecade; year += 10) {
    ticks.push(year);
  }
  
  return ticks;
};

const generateFiftyYearMarks = (minYear: number, maxYear: number): number[] => {
  const startMark = Math.floor(minYear / 50) * 50;
  const endMark = Math.ceil(maxYear / 50) * 50;
  const marks: number[] = [];
  
  for (let year = startMark; year <= endMark; year += 50) {
    marks.push(year);
  }
  
  return marks;
};

const isCentury = (year: number): boolean => {
  return year % 100 === 0;
};

type TimelineProps = {
  height: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  totalWidth: number;
};

export const Timeline = ({ height, minYear, maxYear, currentYear, totalWidth }: TimelineProps) => {
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
          {decadeTicks.map((year) => {
            const y = yScale(year);
            const isCenturyYear = isCentury(year);
            
            return (
              <div
                key={year}
                className="absolute"
                style={{
                  left: TIMELINE_WIDTH - TICK_LENGTH,
                  top: y,
                  width: TICK_LENGTH,
                  height: 1,
                  backgroundColor: "#000",
                }}
              />
            );
          })}
          {decadeTicks.map((year) => {
            const y = yScale(year);
            const isCenturyYear = isCentury(year);
            const fontSize = isCenturyYear ? CENTURY_FONT_SIZE : DECADE_FONT_SIZE;
            const topOffset = calculateLabelTopOffset(fontSize);
            
            return (
              <div
                key={`label-${year}`}
                className="absolute"
                style={{
                  left: TIMELINE_WIDTH - TICK_OFFSET,
                  top: y + topOffset,
                  transform: "translateX(-100%)",
                  fontSize: `${fontSize}px`,
                  fontWeight: isCenturyYear ? "bold" : "normal",
                }}
              >
                {year}
              </div>
            );
          })}
        </div>
      </div>
      {fiftyYearMarks.map((year) => {
        const y = yScale(year);
        const isCenturyYear = isCentury(year);
        return (
          <div
            key={`guideline-${year}`}
            className="absolute pointer-events-none"
            style={{
              left: TIMELINE_WIDTH,
              top: y,
              width: totalWidth,
              height: isCenturyYear ? 2 : 1,
              backgroundColor: "black",
            }}
          />
        );
      })}
      <div
        className="absolute pointer-events-none"
        style={{ left: TIMELINE_WIDTH, top: 0, width: totalWidth, height: height }}
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
