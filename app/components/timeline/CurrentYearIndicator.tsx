"use client";

import * as d3 from "d3";

type CurrentYearIndicatorProps = {
  height: number;
  minYear: number;
  maxYear: number;
  currentYear: number;
  totalWidth: number;
};

export const CurrentYearIndicator = ({
  height,
  minYear,
  maxYear,
  currentYear,
  totalWidth,
}: CurrentYearIndicatorProps) => {
  const yScale = d3.scaleLinear().domain([minYear, maxYear]).range([height, 0]);

  const currentYearY = yScale(currentYear);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: totalWidth, height: height }}
    >
      <div
        className="absolute bg-black h-1"
        style={{
          top: currentYearY,
          width: totalWidth,
        }}
      />
      <div
        className="absolute flex items-baseline -translate-y-full text-black pl-4"
        style={{
          top: currentYearY,
        }}
      >
        <span className="text-[10px]">Current year: </span>
        <span className="font-mono text-[48px] font-bold leading-[32px]">
          {Math.round(currentYear)}
        </span>
      </div>
    </div>
  );
};

