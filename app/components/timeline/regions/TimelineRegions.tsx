"use client";

import { Fragment, useState } from "react";
import * as d3 from "d3";
import { TimelineRegionColumn } from "./TimelineRegionColumn";
import { TimelineContinentLabels } from "./TimelineContinentLabels";
import {
  computeRegionColumnsByContinent,
  createGetWidthEncodingValue,
  DEFAULT_STRIP_WIDTH,
  CONTINENT_GROUP_GAP,
} from "../timeline-utils";
import { TimeBoundGeographicRegion } from "@/app/data/types";

const CONTINENT_FOCUSED_OTHER_WIDTH_RATIO = 0.2;
const WIDTH_ROUNDING_FACTOR = 100;

function roundWidth(width: number): number {
  return Math.round(width * WIDTH_ROUNDING_FACTOR) / WIDTH_ROUNDING_FACTOR;
}

type TimelineRegionsProps = {
  height: number;
  currentYear: number;
  regions: TimeBoundGeographicRegion[];
  widthEncodingKey?: keyof TimeBoundGeographicRegion;
  scaleYearToPageY: d3.ScaleLinear<number, number>;
};

export const TimelineRegions = ({
  height,
  currentYear,
  regions,
  widthEncodingKey = "area",
  scaleYearToPageY,
}: TimelineRegionsProps) => {
  const [focusedContinent, setFocusedContinent] = useState<string | null>(null);
  const continentGroups = computeRegionColumnsByContinent(regions);
  const domain = regions.map((region) => Number(region[widthEncodingKey]));
  const getWidthEncodingValue = createGetWidthEncodingValue(
    domain,
    widthEncodingKey
  );

  const groupsWithBaseWidths = continentGroups.map((group) => {
    const columnsWithWidths = group.columns.map((columnRegions) => {
      const stripWidths = columnRegions.map((region) =>
        getWidthEncodingValue(region)
      );
      const columnWidth = Math.max(...stripWidths, DEFAULT_STRIP_WIDTH);
      return { columnRegions, columnWidth };
    });
    const groupWidth = columnsWithWidths.reduce(
      (sum, c) => sum + c.columnWidth,
      0
    );
    return { ...group, columnsWithWidths, groupWidth };
  });

  const totalGroupWidth = groupsWithBaseWidths.reduce(
    (sum, group) => sum + group.groupWidth,
    0
  );
  const collapsedWidthTotal = groupsWithBaseWidths.reduce((sum, group) => {
    if (group.continentName === focusedContinent) {
      return sum;
    }
    return sum + group.groupWidth * CONTINENT_FOCUSED_OTHER_WIDTH_RATIO;
  }, 0);

  const groupsWithWidths = groupsWithBaseWidths.map((group) => {
    const targetGroupWidth =
      focusedContinent === null
        ? group.groupWidth
        : focusedContinent === group.continentName
          ? Math.max(totalGroupWidth - collapsedWidthTotal, 0)
          : group.groupWidth * CONTINENT_FOCUSED_OTHER_WIDTH_RATIO;
    const widthScale =
      group.groupWidth > 0 ? targetGroupWidth / group.groupWidth : 1;
    const columnsWithWidths = group.columnsWithWidths.map(
      ({ columnRegions, columnWidth }) => ({
        columnRegions,
        columnWidth: roundWidth(columnWidth * widthScale),
      })
    );
    return {
      ...group,
      columnsWithWidths,
      groupWidth: roundWidth(targetGroupWidth),
    };
  });

  const toggleFocusedContinent = (continentName: string) =>
    setFocusedContinent((currentFocusedContinent) =>
      currentFocusedContinent === continentName ? null : continentName
    );

  return (
    <div className="relative" style={{ height }}>
      <TimelineContinentLabels
        groupsWithWidths={groupsWithWidths}
        focusedContinent={focusedContinent}
        onToggleFocusedContinent={toggleFocusedContinent}
      />
      <div className="flex" style={{ height }}>
        {groupsWithWidths.map((group, groupIndex) => (
          <Fragment key={group.continentName}>
            {group.columnsWithWidths.map(
              ({ columnRegions, columnWidth }, colIndex) => (
                <TimelineRegionColumn
                  key={`${group.continentName}-${colIndex}`}
                  height={height}
                  currentYear={currentYear}
                  regions={columnRegions}
                  columnWidth={columnWidth}
                  scaleYearToPageY={scaleYearToPageY}
                />
              )
            )}
            {groupIndex < groupsWithWidths.length - 1 && (
              <div
                className="bg-gray-200/50"
                style={{ width: CONTINENT_GROUP_GAP, height }}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
