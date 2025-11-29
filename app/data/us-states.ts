import type {
  TimeBoundGeographicRegion,
  TimeBoundGeographicRegionGroup,
  TimeRange,
} from "./types";
import type { GeoJSON } from "geojson";
import statesData from "./us-states.json";
import statesFoundedData from "./date-us-states-were-founded.json";

type StateFounded = {
  name: string;
  founded: number;
};

function findStateFeature(
  stateName: string,
  geojson: GeoJSON.FeatureCollection
): GeoJSON.Feature | null {
  return (
    geojson.features.find(
      (feature) =>
        feature.properties?.name?.toLowerCase() === stateName.toLowerCase()
    ) || null
  );
}

function createTimeBoundRegionForState(
  stateName: string,
  foundedYear: number,
  feature: GeoJSON.Feature
): TimeBoundGeographicRegion {
  const featureCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [feature],
  };

  const timeRange: TimeRange = [foundedYear, null];

  return {
    timeRange,
    geographicRegions: [featureCollection],
    metadata: {
      id: `state-${stateName.toLowerCase().replace(/\s+/g, "-")}`,
      title: stateName,
      description: `State of ${stateName}, founded in ${foundedYear}`,
      color: "#0080ff",
    },
  };
}

export function generateUSStatesData(): TimeBoundGeographicRegionGroup {
  const statesFounded = statesFoundedData as StateFounded[];
  const geojson = statesData as GeoJSON.FeatureCollection;

  const timeBoundRegions: TimeBoundGeographicRegion[] = statesFounded
    .map((state) => {
      const feature = findStateFeature(state.name, geojson);
      if (!feature) {
        console.warn(`Could not find GeoJSON feature for state: ${state.name}`);
        return null;
      }
      return createTimeBoundRegionForState(state.name, state.founded, feature);
    })
    .filter(
      (region): region is TimeBoundGeographicRegion => region !== null
    );

  return {
    children: timeBoundRegions,
    metadata: {
      id: "united-states",
      title: "United States",
      description: "US states by founding year",
    },
  };
}

