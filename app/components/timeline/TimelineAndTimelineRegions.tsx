"use client";

import { Timeline } from "./Timeline";
import { TimelineRegions } from "./TimelineRegions";
import type { TimeRange, Metadata } from "../../data/types";

type RegionData = {
  id: string;
  timeRange: TimeRange;
  color?: string;
  metadata?: Metadata;
  hierarchy?: string[];
  area: number;
};

type TimelineAndTimelineRegionsProps = {
  height: number;
  minYear: number;
  maxYear: number;
  selectedYear: number;
  regions: RegionData[];
  widthEncodingKey?: keyof RegionData;
  onYearChange: (year: number) => void;
  onZoomChange: (minYear: number, maxYear: number) => void;
};

export const TimelineAndTimelineRegions = ({
  height,
  minYear,
  maxYear,
  selectedYear,
  regions,
  widthEncodingKey,
  onYearChange,
  onZoomChange,
}: TimelineAndTimelineRegionsProps) => {
  return (
    <div className="flex" style={{ height: height }}>
      <Timeline
        height={height}
        minYear={minYear}
        maxYear={maxYear}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        onZoomChange={onZoomChange}
      />
      <TimelineRegions
        height={height}
        minYear={minYear}
        maxYear={maxYear}
        regions={regions}
        widthEncodingKey={widthEncodingKey}
      />
    </div>
  );
};
