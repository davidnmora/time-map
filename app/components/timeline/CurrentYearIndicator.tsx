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
          left: 0,
          top: currentYearY,
          width: totalWidth,
          height: 4,
          backgroundColor: "#000",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "50%",
          top: currentYearY - 8,
          transform: "translateX(-50%)",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#000",
        }}
      >
        Current Year:{" "}
        <span style={{ fontFamily: "monospace", fontSize: "48px" }}>
          {Math.round(currentYear)}
        </span>
      </div>
    </div>
  );
};

