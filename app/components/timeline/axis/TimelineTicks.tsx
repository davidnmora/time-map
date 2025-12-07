import * as d3 from "d3";
import {
  TIMELINE_AXIS_WIDTH,
  TICK_LENGTH,
  getTickThickness,
} from "./timeline-axis-utils";

type TimelineTicksProps = {
  ticks: number[];
  scaleYearToPageY: d3.ScaleLinear<number, number>;
  getAxisElementColor: (year: number) => string;
};

export const TimelineTicks = ({
  ticks,
  scaleYearToPageY,
  getAxisElementColor,
}: TimelineTicksProps) => {
  return (
    <>
      {ticks.map((year) => {
        const y = scaleYearToPageY(year);
        const tickHeight = getTickThickness(year);
        const color = getAxisElementColor(year);

        return (
          <div
            key={year}
            className="absolute translate-y-[-50%]"
            style={{
              left: TIMELINE_AXIS_WIDTH - TICK_LENGTH,
              top: y,
              width: TICK_LENGTH,
              height: tickHeight,
              backgroundColor: color,
            }}
          />
        );
      })}
    </>
  );
};

