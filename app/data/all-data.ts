import type { TimeBoundGeographicRegionGroup } from "./types";
import { generateUSStatesData } from "./us-states";

function getAllData(): TimeBoundGeographicRegionGroup {
  return generateUSStatesData();
}

export const allData = getAllData();
