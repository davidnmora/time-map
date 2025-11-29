import type { TimeBoundGeographicRegionGroup } from "../types/data";
import { generateUSStatesData } from "./us-states";

export function getAllData(): TimeBoundGeographicRegionGroup {
  return generateUSStatesData();
}

