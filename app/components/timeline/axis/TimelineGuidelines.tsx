import * as d3 from "d3";
import {
  TIMELINE_WIDTH,
  isCentury,
  isHalfCentury,
} from "./timeline-axis-utils";

type TimelineGuidelinesProps = {
  ticks: number[];
  yScale: d3.ScaleLinear<number, number>;
  totalWidth: number;
};

export const TimelineGuidelines = ({
  ticks,
  yScale,
  totalWidth,
}: TimelineGuidelinesProps) => {
  const guidelineYears = ticks.filter(
    (year) => isCentury(year) || isHalfCentury(year)
  );
  return (
    <>
      {guidelineYears.map((year) => {
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
              transform: "translateY(-50%)",
              backgroundColor: "black",
            }}
          />
        );
      })}
    </>
  );
};

