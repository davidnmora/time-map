import * as turf from "@turf/turf";
import type { TimeBoundGeographicRegion } from "../../data/types";
import {
  getContinentForCountry,
  CONTINENT_GROUP_NAMES,
  sortRegionsForContinent,
  type ContinentGroup,
} from "../../data/continent-mapping";
import { TIMELINE_AXIS_WIDTH } from "./axis/timeline-axis-utils";

export type Column = TimeBoundGeographicRegion[];

export const MIN_STRIP_WIDTH = 4;
export const MAX_STRIP_WIDTH = 55;
export const DEFAULT_STRIP_WIDTH = 0.001;

export const CONTINENT_GROUP_GAP = 4;
export const TIMELINE_RIGHT_PADDING = 24;
export const TIMELINE_EXPANDED_WIDTH_RATIO = 0.8;
export const TIMELINE_TOGGLE_BUTTON_REQUIRED_WIDTH = 220;
const NUM_CONTINENT_GAPS = CONTINENT_GROUP_NAMES.length - 1;

export const TIMELINE_BACKDROP_OPACITY = 0.8;
export const BACKDROP_BLUR = `backdrop-blur-xs`;
export const BACKDROP_COLOR = `bg-white/${Math.round(
  TIMELINE_BACKDROP_OPACITY * 100,
)}`;
export const DROP_SHADOW = "shadow-[-2px_2px_4px_rgba(0,0,0,0.1)]";
export const TIMELINE_TOGGLE_BUTTON_Z_INDEX = "z-20";
export const CURRENT_YEAR_INDICATOR_Z_INDEX = "z-30";
export const TIMELINE_REGION_RESIZE_DURATION_MS = 450;
export const TIMELINE_REGION_RESIZE_EASING = "ease-in-out";
export const TIMELINE_REGION_RESIZE_WIDTH_TRANSITION = `width ${TIMELINE_REGION_RESIZE_DURATION_MS}ms ${TIMELINE_REGION_RESIZE_EASING}`;
export const TIMELINE_REGION_RESIZE_WIDTH_OPACITY_TRANSITION = `width ${TIMELINE_REGION_RESIZE_DURATION_MS}ms ${TIMELINE_REGION_RESIZE_EASING}, opacity ${TIMELINE_REGION_RESIZE_DURATION_MS}ms ${TIMELINE_REGION_RESIZE_EASING}`;

export function createGetWidthEncodingValue(
  domain: number[],
  domainKey: keyof TimeBoundGeographicRegion,
): (region: TimeBoundGeographicRegion) => number {
  if (domain.length === 0) {
    return () => DEFAULT_STRIP_WIDTH;
  }
  const domainMin = Math.min(...domain.filter((a) => a > 0));
  const domainMax = Math.max(...domain);
  if (domainMin === domainMax || domainMax === 0) {
    return () => DEFAULT_STRIP_WIDTH;
  }
  return (region: TimeBoundGeographicRegion) => {
    const domainValue = Number(region[domainKey]);
    if (domainValue === 0) return MIN_STRIP_WIDTH;
    const normalized = (domainValue - domainMin) / (domainMax - domainMin);
    const width =
      MIN_STRIP_WIDTH + normalized * (MAX_STRIP_WIDTH - MIN_STRIP_WIDTH);
    return Math.round(width * 100) / 100;
  };
}

export type ContinentColumnGroup = {
  continentName: ContinentGroup;
  columns: Column[];
};

function getCentroidLongitude(region: TimeBoundGeographicRegion): number {
  const fc = region.geographicRegions[0];
  if (!fc?.features?.length) return 0;
  try {
    const centroidPoint = turf.centroid(fc);
    return centroidPoint.geometry.coordinates[0];
  } catch {
    return 0;
  }
}

export function computeRegionColumnsByContinent(
  regions: TimeBoundGeographicRegion[],
): ContinentColumnGroup[] {
  const grouped = new Map<ContinentGroup, TimeBoundGeographicRegion[]>();
  for (const name of CONTINENT_GROUP_NAMES) {
    grouped.set(name, []);
  }

  for (const region of regions) {
    const continent = getContinentForCountry(region.metadata.title);
    if (continent) {
      grouped.get(continent)!.push(region);
    }
  }

  return CONTINENT_GROUP_NAMES.map((name) => {
    const regionList = grouped.get(name) ?? [];
    const sorted = sortRegionsForContinent(
      name,
      regionList,
      getCentroidLongitude,
      (r) => r.metadata.title,
    );
    return {
      continentName: name,
      columns: sorted.map((r) => [r]),
    };
  });
}

export const calculateTimelineWidth = (
  regions: TimeBoundGeographicRegion[],
  widthEncodingKey: keyof TimeBoundGeographicRegion = "area",
): number => {
  const continentGroups = computeRegionColumnsByContinent(regions);
  const domain = regions.map((region) => Number(region[widthEncodingKey]));
  const getWidthEncodingValue = createGetWidthEncodingValue(
    domain,
    widthEncodingKey,
  );

  const totalColumnsWidth = continentGroups.reduce((groupSum, group) => {
    const groupWidth = group.columns.reduce((colSum, columnRegions) => {
      const stripWidths = columnRegions.map((region) =>
        getWidthEncodingValue(region),
      );
      const columnWidth =
        Math.round(Math.max(...stripWidths, DEFAULT_STRIP_WIDTH) * 100) / 100;
      return colSum + columnWidth;
    }, 0);
    return groupSum + groupWidth;
  }, 0);

  const gapsWidth = NUM_CONTINENT_GAPS * CONTINENT_GROUP_GAP;
  return (
    TIMELINE_AXIS_WIDTH + totalColumnsWidth + gapsWidth + TIMELINE_RIGHT_PADDING
  );
};

export const calculateExpandedTimelineWidth = (viewportWidth: number): number => {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return 0;
  }

  const targetWidth = viewportWidth * TIMELINE_EXPANDED_WIDTH_RATIO;
  const remainingWidth = viewportWidth - targetWidth;
  const maxWidthWithButtonRoom = Math.max(
    0,
    viewportWidth - TIMELINE_TOGGLE_BUTTON_REQUIRED_WIDTH,
  );
  const timelineMinimumVisibleWidth = TIMELINE_AXIS_WIDTH + TIMELINE_RIGHT_PADDING;

  if (remainingWidth < TIMELINE_TOGGLE_BUTTON_REQUIRED_WIDTH) {
    return Math.min(
      viewportWidth,
      Math.max(timelineMinimumVisibleWidth, maxWidthWithButtonRoom),
    );
  }

  return targetWidth;
};
