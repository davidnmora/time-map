import type {
  TimeBoundGeographicRegion,
  TimeBoundGeographicRegionGroup,
  PartialTimeBoundGeographicRegion,
  PartialTimeBoundGeographicRegionGroup,
} from "./types";
import { generateUSStatesData } from "./us-states";
import { generateModernCountriesData } from "./modern-countries";
import { calculateTotalArea, addTitleToHierarchy } from "./data-utils";

function completeRegion(
  region: PartialTimeBoundGeographicRegion,
  hierarchy: string[] = []
): TimeBoundGeographicRegion {
  return {
    ...region,
    area: calculateTotalArea(region.geographicRegions),
    hierarchy: addTitleToHierarchy(hierarchy, region.metadata.title),
  };
}

function completeGroup(
  group: PartialTimeBoundGeographicRegionGroup,
  hierarchy: string[] = []
): TimeBoundGeographicRegionGroup {
  const currentHierarchy = addTitleToHierarchy(hierarchy, group.metadata.title);
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

const partialDataset: PartialTimeBoundGeographicRegionGroup = {
  children: [generateUSStatesData(), generateModernCountriesData()],
  metadata: {
    id: "complete-dataset",
    title: "",
    description: "All geographic regions by time period",
  },
};

export const completeDataset = completeGroup(partialDataset);

