import * as d3 from "d3";
import { TIMELINE_WIDTH, TICK_OFFSET, DECADE_FONT_SIZE, CENTURY_FONT_SIZE, isCentury } from "./timeline-axis-utils";

type TimelineLabelsProps = {
  decadeTicks: number[];
  yScale: d3.ScaleLinear<number, number>;
};

export const TimelineLabels = ({ decadeTicks, yScale }: TimelineLabelsProps) => {
  return (
    <>
      {decadeTicks.map((year) => {
        const y = yScale(year);
        const isCenturyYear = isCentury(year);
        const fontSize = isCenturyYear ? CENTURY_FONT_SIZE : DECADE_FONT_SIZE;
        
        return (
          <div
            key={`label-${year}`}
            className="absolute translate-y-[-50%]"
            style={{
              left: TIMELINE_WIDTH - TICK_OFFSET,
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

