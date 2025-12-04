import * as turf from "@turf/turf";
import type { GeographicRegion } from "../../data/types";

export function calculateTotalArea(
  geographicRegions?: GeographicRegion[]
): number {
  if (!geographicRegions || geographicRegions.length === 0) {
    return 0;
  }
  return geographicRegions.reduce((total, geoRegion) => {
    return total + turf.area(geoRegion);
  }, 0);
}

