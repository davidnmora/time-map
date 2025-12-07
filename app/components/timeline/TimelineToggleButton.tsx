"use client";

import * as d3 from "d3";
import { BACKDROP_BLUR, BACKDROP_COLOR } from "./timeline-utils";

const CURRENT_YEAR_FONT_SIZE = 64;
const CURRENT_YEAR_LABEL_FONT_SIZE = 10;
const ARROW_FONT_SIZE = 18;
const BUTTON_PADDING_X = 16;
const BUTTON_PADDING_Y = 8;
const GAP_SIZE = 4;

type TimelineToggleButtonProps = {
  currentYear: number;
  expanded: boolean;
  onToggle: () => void;
  height: number;
  minYear: number;
  maxYear: number;
};

export const TimelineToggleButton = ({
  currentYear,
  expanded,
  onToggle,
  height,
  minYear,
  maxYear,
}: TimelineToggleButtonProps) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const yScale = d3.scaleLinear().domain([minYear, maxYear]).range([height, 0]);
  const currentYearY = yScale(currentYear);

  const offsetFromButtonTopToTextCenter =
    BUTTON_PADDING_Y +
    CURRENT_YEAR_LABEL_FONT_SIZE +
    GAP_SIZE +
    CURRENT_YEAR_FONT_SIZE / 2;

  return (
    <button
      data-timeline-toggle-button
      onClick={onToggle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={`absolute left-0 -translate-x-full ${BACKDROP_COLOR} ${BACKDROP_BLUR} rounded-l-lg flex flex-col items-center justify-center hover:bg-white/70 transition-colors z-20`}
      style={{
        top: currentYearY - offsetFromButtonTopToTextCenter,
        paddingLeft: BUTTON_PADDING_X,
        paddingRight: BUTTON_PADDING_X,
        paddingTop: BUTTON_PADDING_Y,
        paddingBottom: BUTTON_PADDING_Y,
        gap: GAP_SIZE,
      }}
      aria-label={expanded ? "Collapse timeline" : "Expand timeline"}
    >
      <span
        className="text-gray-700 leading-tight"
        style={{ fontSize: CURRENT_YEAR_LABEL_FONT_SIZE }}
      >
        Current Year
      </span>
      <span
        className="text-gray-700 font-mono font-bold leading-none"
        style={{ fontSize: CURRENT_YEAR_FONT_SIZE }}
      >
        {Math.round(currentYear)}
      </span>
      <div className="flex items-center gap-2">
        <span
          className="text-gray-700 font-bold"
          style={{ fontSize: ARROW_FONT_SIZE }}
        >
          {expanded ? "→" : "←"}
        </span>
        <span className="text-gray-700 text-xs whitespace-nowrap">
          {expanded ? "close timeline" : "open timeline"}
        </span>
      </div>
    </button>
  );
};
