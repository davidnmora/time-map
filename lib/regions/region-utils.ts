import type {
  InteractiveGeographicRegionMapLayer,
} from "./types";
import type {
  TimeRange,
  TimeBoundGeographicRegionGroup,
} from "@/app/data/types";
import { getAFlagListOfAllRegions } from "@/app/data/data-utils";

const DEFAULT_FILL_OPACITY = 0.2;
const DEFAULT_LINE_WIDTH = 1;
const DEFAULT_LINE_COLOR = "#000";

export const TOOLTIP_WIDTH = 200;

const LAYER_ID_SEPARATOR = "---";

export function createRegionId(baseId: string, index: number): string {
  return `${baseId}${LAYER_ID_SEPARATOR}${index}`;
}

export function doesRegionIdMatch(
  regionId: string,
  baseRegionId: string
): boolean {
  return (
    regionId === baseRegionId ||
    regionId.startsWith(`${baseRegionId}${LAYER_ID_SEPARATOR}`)
  );
}

export type TooltipData = {
  hierarchy: string[];
  title: string;
  description?: string;
  timeRange: TimeRange;
};

export const formatTimeRange = (timeRange: TimeRange): string => {
  const [start, end] = timeRange;
  if (end === null) {
    return `${start} - present`;
  }
  return `${start} - ${end}`;
};

export function convertAllToMapRegions(
  group: TimeBoundGeographicRegionGroup
): InteractiveGeographicRegionMapLayer[] {
  const regions = getAFlagListOfAllRegions(group);
  return regions.flatMap((region) =>
    region.geographicRegions.map((geoRegion, index) => ({
      id: createRegionId(region.metadata.id, index),
      data: geoRegion,
      fillColor: region.metadata.color,
      fillOpacity: DEFAULT_FILL_OPACITY,
      lineColor: DEFAULT_LINE_COLOR,
      lineWidth: DEFAULT_LINE_WIDTH,
      metadata: region.metadata,
      timeRange: region.timeRange,
      hierarchy: region.hierarchy,
    }))
  );
}
