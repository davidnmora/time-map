import * as d3 from "d3";
import {
  TIMELINE_WIDTH,
  TICK_LENGTH,
  isCentury,
  isTwentyFiveYearMark,
  isDecade,
  getTickThickness,
} from "./timeline-axis-utils";

type TimelineTicksProps = {
  ticks: number[];
  yScale: d3.ScaleLinear<number, number>;
};

export const TimelineTicks = ({ ticks, yScale }: TimelineTicksProps) => {
  return (
    <>
      {ticks.map((year) => {
        const y = yScale(year);
        const isCenturyYear = isCentury(year);
        const is25Year = isTwentyFiveYearMark(year);
        const isDecadeYear = isDecade(year);

        const tickHeight = getTickThickness(year);

        return (
          <div
            key={year}
            className="absolute translate-y-[-50%]"
            style={{
              left: TIMELINE_WIDTH - TICK_LENGTH,
              top: y,
              width: TICK_LENGTH,
              height: tickHeight,
              backgroundColor: "black",
            }}
          />
        );
      })}
    </>
  );
};

