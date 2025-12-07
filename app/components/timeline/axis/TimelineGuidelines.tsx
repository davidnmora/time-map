import * as d3 from "d3";
import {
  TIMELINE_AXIS_WIDTH,
  isCentury,
  isHalfCentury,
  getTickThickness,
} from "./timeline-axis-utils";

type TimelineGuidelinesProps = {
  ticks: number[];
  yScale: d3.ScaleLinear<number, number>;
  totalWidth: number;
  getAxisElementColor: (year: number) => string;
};

export const TimelineGuidelines = ({
  ticks,
  yScale,
  totalWidth,
  getAxisElementColor,
}: TimelineGuidelinesProps) => {
  const guidelineYears = ticks.filter(
    (year) => isCentury(year) || isHalfCentury(year)
  );
  return (
    <>
      {guidelineYears.map((year) => {
        const y = yScale(year);
        return (
          <div
            key={`guideline-${year}`}
            className="absolute pointer-events-none"
            style={{
              left: TIMELINE_AXIS_WIDTH,
              top: y,
              width: totalWidth,
              height: getTickThickness(year),
              transform: "translateY(-50%)",
              backgroundColor: getAxisElementColor(year),
            }}
          />
        );
      })}
    </>
  );
};

