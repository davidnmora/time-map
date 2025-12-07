"use client";

import * as d3 from "d3";

type CurrentYearIndicatorProps = {
  height: number;
  currentYear: number;
  totalWidth: number;
  yScale: d3.ScaleLinear<number, number>;
};

export const CurrentYearIndicator = ({
  height,
  currentYear,
  totalWidth,
  yScale,
}: CurrentYearIndicatorProps) => {
  const currentYearY = yScale(currentYear);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: totalWidth, height: height }}
    >
      <div
        className="absolute bg-black h-1 translate-y-[-50%]"
        style={{
          top: currentYearY,
          width: totalWidth,
        }}
      />
    </div>
  );
};

