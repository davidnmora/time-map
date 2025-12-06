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
    <svg
      width={totalWidth}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
    >
      <line
        x1={0}
        x2={totalWidth}
        y1={currentYearY}
        y2={currentYearY}
        stroke="#000"
        strokeWidth={4}
      />
      <text
        x={totalWidth / 2}
        y={currentYearY - 8}
        textAnchor="middle"
        fontWeight="bold"
        fontSize="14px"
        fill="#000"
      >
        Current Year: <tspan fontSize="48px">{currentYear}</tspan>
      </text>
    </svg>
  );
};

