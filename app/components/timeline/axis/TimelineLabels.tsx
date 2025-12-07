import * as d3 from "d3";
import {
  TIMELINE_AXIS_WIDTH,
  TICK_OFFSET,
  DECADE_FONT_SIZE,
  CENTURY_FONT_SIZE,
  isCentury,
  isTwentyFiveYearMark,
  isDecade,
} from "./timeline-axis-utils";

type TimelineLabelsProps = {
  ticks: number[];
  yScale: d3.ScaleLinear<number, number>;
};

export const TimelineLabels = ({ ticks, yScale }: TimelineLabelsProps) => {
  return (
    <>
      {ticks.map((year) => {
        const y = yScale(year);
        const isCenturyYear = isCentury(year);
        const is25Year = isTwentyFiveYearMark(year);
        const isDecadeYear = isDecade(year);

        const fontSize = isCenturyYear ? CENTURY_FONT_SIZE : DECADE_FONT_SIZE;

        return (
          <div
            key={`label-${year}`}
            className="absolute translate-y-[-50%] font-mono"
            style={{
              left: TIMELINE_AXIS_WIDTH - TICK_OFFSET,
              top: y,
              transform: "translateX(-100%)",
              fontSize: `${fontSize}px`,
              fontWeight: isCenturyYear ? "bold" : "normal",
            }}
          >
            {year}
          </div>
        );
      })}
    </>
  );
};

