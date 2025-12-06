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
        className="absolute"
        style={{
          top: currentYearY,
          width: totalWidth,
          height: 4,
          backgroundColor: "#000",
        }}
      />
      <div
        className="absolute flex items-baseline"
        style={{
          top: currentYearY,
          transform: "translateY(-100%)",
          color: "#000",
          paddingLeft: "16px",
        }}
      >
        <span style={{ fontSize: "10px" }}>Current year: </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "48px",
            fontWeight: "bold",
            lineHeight: "32px",
          }}
        >
          {Math.round(currentYear)}
        </span>
      </div>
    </div>
  );
};

