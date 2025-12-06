"use client";

import * as d3 from "d3";

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

const isCentury = (year: number): boolean => {
  return year % 100 === 0;
};

type TimelineProps = {
  height: number;
  minYear: number;
  maxYear: number;
};

export const Timeline = ({ height, minYear, maxYear }: TimelineProps) => {
  const yScale = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([height, 0]);

  const decadeTicks = generateDecadeTicks(minYear, maxYear);

  return (
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
  );
};
