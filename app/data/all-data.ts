import type { TimeBoundGeographicRegionGroup } from "./types";
import { generateUSStatesData } from "./us-states";

export function getAllData(): TimeBoundGeographicRegionGroup {
  return generateUSStatesData();
}

