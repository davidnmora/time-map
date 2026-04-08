"use client";

import { Fragment } from "react";
import {
  BACKDROP_COLOR,
  CONTINENT_GROUP_GAP,
  DROP_SHADOW,
  TIMELINE_REGION_RESIZE_WIDTH_TRANSITION,
} from "../timeline-utils";

const CONTINENT_HEADER_HEIGHT = 28;
const CONTINENT_HEADER_FONT_SIZE = 12;
const CONTINENT_HEADER_Z_INDEX = "z-40";

type TimelineContinentLabelGroup = {
  continentName: string;
  groupWidth: number;
};

type TimelineContinentLabelsProps = {
  groupsWithWidths: TimelineContinentLabelGroup[];
  focusedContinent: string | null;
  onToggleFocusedContinent: (continentName: string) => void;
};

export const TimelineContinentLabels = ({
  groupsWithWidths,
  focusedContinent,
  onToggleFocusedContinent,
}: TimelineContinentLabelsProps) => (
  <div className={`absolute top-0 left-0 flex ${CONTINENT_HEADER_Z_INDEX}`}>
    {groupsWithWidths.map((group, i) => (
      <Fragment key={group.continentName}>
        <div
          className="flex items-start justify-center"
          style={{
            width: group.groupWidth,
            height: CONTINENT_HEADER_HEIGHT,
            fontSize: CONTINENT_HEADER_FONT_SIZE,
            lineHeight: 1.2,
            transition: TIMELINE_REGION_RESIZE_WIDTH_TRANSITION,
          }}
        >
          <button
            type="button"
            onClick={() => onToggleFocusedContinent(group.continentName)}
            aria-pressed={focusedContinent === group.continentName}
            className={`h-full w-full cursor-pointer text-center text-gray-700 font-bold px-1 pt-1 whitespace-nowrap overflow-hidden pointer-events-auto rounded-lg border border-gray-300/70 bg-gray-100/90 hover:bg-white/100 transition-colors ${BACKDROP_COLOR} ${DROP_SHADOW}`}
          >
            {group.continentName}
          </button>
        </div>
        {i < groupsWithWidths.length - 1 && (
          <div style={{ width: CONTINENT_GROUP_GAP }} />
        )}
      </Fragment>
    ))}
  </div>
);
