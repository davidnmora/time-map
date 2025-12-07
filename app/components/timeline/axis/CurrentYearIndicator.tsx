"use client";

import * as d3 from "d3";
import { CURRENT_YEAR_INDICATOR_Z_INDEX } from "../timeline-utils";

type CurrentYearIndicatorProps = {
  height: number;
  currentYear: number;
  totalWidth: number;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
};

const OVERLAP_WITH_TOGGLE_BUTTON = 12;
const DROP_SHADOW = "shadow-[-2px_2px_5px_rgba(0,0,0,0.7)]";

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
        className={`absolute bg-black h-1.5 translate-y-[-50%] ${DROP_SHADOW} ${CURRENT_YEAR_INDICATOR_Z_INDEX}`}
        style={{
          top: currentYearY,
          left: -OVERLAP_WITH_TOGGLE_BUTTON,
          width: totalWidth + OVERLAP_WITH_TOGGLE_BUTTON,
        }}
      />
    </div>
  );
};

