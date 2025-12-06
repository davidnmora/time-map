import * as d3 from "d3";
import { TIMELINE_WIDTH, TICK_LENGTH, isCentury } from "./timeline-axis-utils";

type TimelineTicksProps = {
  decadeTicks: number[];
  yScale: d3.ScaleLinear<number, number>;
};

export const TimelineTicks = ({ decadeTicks, yScale }: TimelineTicksProps) => {
  return (
    <>
      {decadeTicks.map((year) => {
        const y = yScale(year);
        const isCenturyYear = isCentury(year);
        
        return (
          <div
            key={year}
            className="absolute translate-y-[-50%]"
            style={{
              left: TIMELINE_WIDTH - TICK_LENGTH,
              top: y,
              width: TICK_LENGTH,
              height: isCenturyYear ? 2 : 1,
              backgroundColor: "black",
            }}
          />
        );
      })}
    </>
  );
};

