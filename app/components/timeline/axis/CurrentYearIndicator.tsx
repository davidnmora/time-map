"use client";

import * as d3 from "d3";

type CurrentYearIndicatorProps = {
  height: number;
  currentYear: number;
  totalWidth: number;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
};

export const CurrentYearIndicator = ({
  height,
  currentYear,
  totalWidth,
  scaleYearToPageY,
}: CurrentYearIndicatorProps) => {
  const currentYearY = scaleYearToPageY(currentYear);

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

