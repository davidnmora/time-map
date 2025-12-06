import type {
  TimeBoundGeographicRegion,
  TimeBoundGeographicRegionGroup,
  PartialTimeBoundGeographicRegion,
  PartialTimeBoundGeographicRegionGroup,
} from "./types";
import { generateUSStatesData } from "./us-states";
import { calculateTotalArea } from "../utils/data";

function completeRegion(
  region: PartialTimeBoundGeographicRegion,
  hierarchy: string[] = []
): TimeBoundGeographicRegion {
  return {
    ...region,
    area: calculateTotalArea(region.geographicRegions),
    hierarchy,
  };
}

function completeGroup(
  group: PartialTimeBoundGeographicRegionGroup,
  hierarchy: string[] = []
): TimeBoundGeographicRegionGroup {
  const currentHierarchy = [...hierarchy, group.metadata.title];
  return {
    ...group,
    hierarchy: currentHierarchy,
    children: group.children.map((child) => {
      if ("children" in child) {
        return completeGroup(child, currentHierarchy);
      } else {
        return completeRegion(child, currentHierarchy);
      }
    }),
  };
}

const partialDataset = generateUSStatesData();

export const completeDataset = completeGroup(partialDataset);

