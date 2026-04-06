"use client";

import { Fragment } from "react";
import * as d3 from "d3";
import { TimelineRegionColumn } from "./TimelineRegionColumn";
import {
  computeRegionColumnsByContinent,
  createGetWidthEncodingValue,
  DEFAULT_STRIP_WIDTH,
  CONTINENT_GROUP_GAP,
} from "../timeline-utils";
import { TimeBoundGeographicRegion } from "@/app/data/types";

const CONTINENT_HEADER_HEIGHT = 28;
const CONTINENT_HEADER_FONT_SIZE = 8;

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
  const continentGroups = computeRegionColumnsByContinent(regions);
  const domain = regions.map((region) => Number(region[widthEncodingKey]));
  const getWidthEncodingValue = createGetWidthEncodingValue(
    domain,
    widthEncodingKey
  );

  const groupsWithWidths = continentGroups.map((group) => {
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

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute top-0 left-0 flex pointer-events-none z-10">
        {groupsWithWidths.map((group, i) => (
          <Fragment key={group.continentName}>
            <div
              className="flex items-start justify-center bg-white/90"
              style={{
                width: group.groupWidth,
                height: CONTINENT_HEADER_HEIGHT,
                fontSize: CONTINENT_HEADER_FONT_SIZE,
                lineHeight: 1.2,
              }}
            >
              <span className="text-center text-gray-600 font-medium px-0.5 pt-1 break-words overflow-hidden">
                {group.continentName}
              </span>
            </div>
            {i < groupsWithWidths.length - 1 && (
              <div style={{ width: CONTINENT_GROUP_GAP }} />
            )}
          </Fragment>
        ))}
      </div>
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
