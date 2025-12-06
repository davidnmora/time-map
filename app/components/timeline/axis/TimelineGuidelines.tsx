import * as d3 from "d3";
import { TIMELINE_WIDTH, isCentury } from "./timeline-axis-utils";

type TimelineGuidelinesProps = {
  fiftyYearMarks: number[];
  yScale: d3.ScaleLinear<number, number>;
  totalWidth: number;
};

export const TimelineGuidelines = ({ fiftyYearMarks, yScale, totalWidth }: TimelineGuidelinesProps) => {
  return (
    <>
      {fiftyYearMarks.map((year) => {
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

