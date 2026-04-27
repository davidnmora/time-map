import type { GeoJSON } from "geojson";
import type {
  PartialTimeBoundGeographicRegion,
  PartialTimeBoundGeographicRegionGroup,
  TimeRange,
} from "./types";
import rawCottereau from "./civilizations-from-cottereau/2500_BC_civilizations.json";

const COTTEREAU_2500_BCE_T_RANGE: TimeRange = [-2520, -2480]; // TODO: just a placeholder, eventually we want real date ranges for every region
const COTTEREAU_GROUP_COLOR = "#6b5b4a";
const COTTEREAU_FALLBACK_FILL = "#666666";

type RawFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSON.Feature[];
};

const cottereau2500BceFeatureCollection: GeoJSON.FeatureCollection = (() => {
  const r = rawCottereau as RawFeatureCollection & Record<string, unknown>;
  return { type: "FeatureCollection", features: r.features };
})();

function slugId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function formatTitle(labelHint: string) {
  return labelHint.replace(/_/g, " ");
}

export function generateCottereau2500BceData(): PartialTimeBoundGeographicRegionGroup {
  const byLabel = new Map<string, GeoJSON.Feature[]>();
  for (const feature of cottereau2500BceFeatureCollection.features) {
    const labelHint = (feature.properties as { label_hint?: string } | null)
      ?.label_hint;
    if (typeof labelHint !== "string" || !labelHint) {
      continue;
    }
    const list = byLabel.get(labelHint) ?? [];
    byLabel.set(labelHint, [...list, feature]);
  }

  const children: PartialTimeBoundGeographicRegion[] = [];
  for (const [labelHint, features] of byLabel) {
    const fill =
      (features[0].properties as { fill?: string } | null)?.fill ??
      COTTEREAU_FALLBACK_FILL;
    const collection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };
    children.push({
      timeRange: COTTEREAU_2500_BCE_T_RANGE,
      geographicRegions: [collection],
      metadata: {
        id: `cottereau-2500bce-${slugId(labelHint)}`,
        title: formatTitle(labelHint),
        description: "Approx. 2500 BCE (Cottereau map, SVG export)",
        color: fill,
      },
    });
  }

  return {
    children,
    metadata: {
      id: "cottereau-2500bce",
      title: "c. 2500 BCE (Cottereau)",
      description: "Ancient polities from the Cottereau map source",
      color: COTTEREAU_GROUP_COLOR,
    },
  };
}
